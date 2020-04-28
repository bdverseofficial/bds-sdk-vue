import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { TranslationService } from './translationService';
import { Source, ContentType, ContentMapItem, Content } from '../models/Cms';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import _ from 'lodash';

export interface CmsStore {
}

export interface CmsOptions {
    localPath?: string;
    remotePath?: string;
    defaultSource?: Source;
    fallbackOnApi?: boolean;
    convertContent?: (type: ContentType, value: string) => string;
    onCatalogChanged?: (catalogKey: string, group: string) => Promise<void>;
}

export class CmsService {

    private options: CmsOptions = {
        defaultSource: "Api",
        fallbackOnApi: true,
    };

    public store: CmsStore = {
        onCatalogChanged: (catalogKey: string) => Promise.resolve(),
    };

    private apiService: ApiService;
    private configService: ConfigService;
    private translationService: TranslationService;
    private connection?: HubConnection;

    constructor(apiService: ApiService, translationService: TranslationService, configService: ConfigService, options?: CmsOptions) {
        this.apiService = apiService;
        this.configService = configService;
        this.translationService = translationService;
        this.options = { ...this.options, ...options };
    }

    public async init(): Promise<void> {
        if (this.configService.configuration) {
            let configCms = this.configService.configuration.cms;
            if (configCms) {
                this.options = { ...this.options, ...configCms };
            }
        }
    }

    public async startConnection(): Promise<HubConnection> {
        if (!this.connection) {
            this.connection = new HubConnectionBuilder().withUrl(this.configService.configuration!.serverUrl! + "hubs/cms?appId=" + this.configService.configuration?.appId).build();
            this.connection.onclose(() => this.internalStartConnection());
            await this.internalStartConnection();
        }
        return this.connection;
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            let c = this.connection;
            this.connection = undefined;
            await c.stop();
        }
    }

    private async internalStartConnection(): Promise<void> {
        if (this.connection && this.connection.state !== HubConnectionState.Connected) {
            await this.connection.start().then(() => this.connectToCatalog()).catch(() => {
                return new Promise((resolve, reject) => window.setTimeout(() => this.internalStartConnection().then(resolve).catch(reject), 5000));
            });
        }
    }

    private async connectToCatalog(): Promise<void> {
        if (this.connection) {
            await this.connection?.send("AddToApplication");
            this.connection.on("RefreshCms", (catalogKey: string, group: string) =>
                this.onRefreshCatalog(catalogKey, group));
        }
    }

    private async onRefreshCatalog(catalogKey: string, group: string) {
        if (this.options.onCatalogChanged) {
            await this.options.onCatalogChanged!(catalogKey, group);
        }
    }

    public async loadContent(group: string, type?: ContentType, name?: string, source?: Source): Promise<string | string[] | null> {
        let content = await this.loadContentFromSouce(group, type, name, source || this.options.defaultSource || "Local");
        if (!content && source !== 'Api') {
            content = await this.loadContentFromSouce(group, type, name, "Api");
        }
        return content;
    }

    private async loadContentFromSouce(group: string, type?: ContentType, name?: string, source?: Source): Promise<string | string[] | null> {
        if (group) {
            if (name && type) {
                if (source === "Api") {
                    return await this.loadApiContent(
                        group,
                        type,
                        name
                    );
                }
                if (source === "Remote") {
                    return await this.loadRemoteContent(
                        group,
                        type,
                        name
                    );
                }
                if (!source || source === "Local") {
                    return await this.loadLocalContent(
                        group,
                        type,
                        name
                    );
                }
            } else {
                if (source === "Api") {
                    return await this.loadGroupApiContent(
                        group
                    );
                }
                if (source === "Remote") {
                    return await this.loadGroupRemoteContent(
                        group
                    );
                }
                if (!source || source === "Local") {
                    return await this.loadGroupLocalContent(
                        group
                    );
                }
            }
        }
        return null;
    }

    public async getContentMap(group: string, source?: string): Promise<ContentMapItem[] | null> {
        let map = await this.getContentMapFromSource(group, source || this.options.defaultSource || "Local");
        if (!map && source !== 'Api') {
            map = await this.getContentMapFromSource(group, "Api");
        }
        if (map) {
            map = _.orderBy(map, m => { return m.order ?? 0 });
        }
        return map;
    }

    private async getContentMapFromSource(group: string, source?: string): Promise<ContentMapItem[] | null> {
        if (group) {
            if (source === "Api") {
                return await this.getApiContentMap(
                    group
                );
            }
            if (source === "Remote") {
                return await this.getRemoteContentMap(
                    group
                );
            }
            if (!source || source === "Local") {
                return await this.getLocalContentMap(
                    group
                );
            }
        }
        return null;
    }

    private async getApiContentMap(group: string, options?: ApiRequestConfig): Promise<ContentMapItem[] | null> {
        let response = await this.apiService.get("api/cms/v1/map/" + group, options);
        if (response) return response.data;
        return null;
    }

    private async getContentByName(group: string, name: string, options?: ApiRequestConfig): Promise<Content | null> {
        options = {
            ...options,
            headers: {
                filters: [
                    "CMS.Content:key|id|value|contentType|order"
                ]
            }
        };
        let response = await this.apiService.get("api/cms/v1/content/" + group + "/" + name, options);
        if (response) return response.data;
        return null;
    }

    private async getContentByKey(contentKey: string, options?: ApiRequestConfig): Promise<Content | null> {
        let response = await this.apiService.get("api/cms/v1/content/" + contentKey, options);
        if (response) return response.data;
        return null;
    }

    private async loadGroupApiContent(group: string): Promise<string[] | null> {
        if (group) {
            let map = await this.getApiContentMap(group);
            if (map) {
                let contents = [];
                map = _.orderBy(map, m => { return m.order ?? 0 });
                console.log(map);
                for (let item of map) {
                    if (item.content) {
                        let content = await this.loadApiContentKey(item.content.key!);
                        if (content) {
                            contents.push(content);
                        }
                    }
                }
                return contents;
            }
        }
        return null;
    }

    private async getLocalContentMap(group: string): Promise<ContentMapItem[] | null> {
        if (group && this.options.localPath) {
            let path = group + "/maps.json";
            return await this.loadContentMap(this.options.localPath, path);
        }
        return null;
    }

    private async loadGroupLocalContent(group: string): Promise<string[] | null> {
        if (group && this.options.localPath) {
            let map = await this.getLocalContentMap(group);
            if (map) {
                let contents = [];
                map = _.orderBy(map, m => { return m.order ?? 0 });
                for (let item of map) {
                    if (item.name && item.contentType) {
                        let content = await this.loadContentPath(item.contentType, this.options.localPath, group, item.name);
                        if (content) {
                            contents.push(content);
                        }
                    }
                }
                return contents;
            }
        }
        return null;
    }

    private async loadRemoteContent(group: string, type: ContentType, name: string): Promise<string | null> {
        if (type && name && group && this.options.remotePath) {
            let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.configService.configuration?.appId;
            return await this.loadContentPath(type, remotePath, group, name);
        }
        return null;
    }

    private async loadLocalContent(group: string, type: ContentType, name: string): Promise<string | null> {
        if (type && name && group && this.options.localPath) {
            return await this.loadContentPath(type, this.options.localPath, group, name);
        }
        return null;
    }

    private async loadApiContentKey(contentKey: string): Promise<string | null> {
        let content = await this.getContentByKey(contentKey);
        if (content) {
            let markdown = content.contentType === "MARKDOWN";
            let value = content.value!;
            if (this.options.convertContent) {
                value = this.options.convertContent(content.contentType! as ContentType, value!);
            }
        }
        return null;
    }

    private async loadApiContent(group: string, type: ContentType, name: string): Promise<string | null> {
        if (name && group) {
            try {
                let content = await this.getContentByName(
                    group,
                    name
                );
                if (content) {
                    let value = content.value!;
                    if (this.options.convertContent) {
                        value = this.options.convertContent(content.contentType! as ContentType, value!);
                    }
                    return value;
                }
            } catch {
                return null;
            }
        }
        return null;
    }

    private getExtension(type: ContentType): string {
        if (type === "MARKDOWN") return "md";
        if (type === "HTML") return "html";
        return "txt";
    }

    private async getRemoteContentMap(group: string): Promise<ContentMapItem[] | null> {
        if (group && this.options.remotePath) {
            let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.configService.configuration?.appId;
            return await this.loadContentMap(remotePath, group);
        }
        return null;
    }

    private async loadGroupRemoteContent(group: string): Promise<string[] | null> {
        if (group && this.options.remotePath) {
            let map = await this.getRemoteContentMap(group);
            if (map) {
                map = _.orderBy(map, m => { return m.order ?? 0 });
                let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.configService.configuration?.appId;
                let contents = [];
                for (let item of map) {
                    if (item.name && item.contentType) {
                        let content = await this.loadContentPath(item.contentType, remotePath, group, item.name);
                        if (content) {
                            contents.push(content);
                        }
                    }
                }
                return contents;
            }
        }
        return null;
    }

    private async loadContentMap(
        root: string,
        group: string
    ): Promise<ContentMapItem[] | null> {
        let fullPath = root + (root.endsWith("/") ? "" : "/") + group + "/maps.json";
        try {
            let response = await this.apiService.get(fullPath, {
                baseURL: "/"
            });
            if (response.status === 200) {
                return response.data;
            }
        } catch {
            return null;
        }
        return null;
    }

    private async loadContentPath(type: ContentType, root: string, group: string, name: string): Promise<string | null> {
        let content = await this.loadContentForLanguage(
            this.translationService.i18n.locale,
            type,
            root,
            group,
            name
        );
        if (
            !content &&
            this.translationService.i18n.locale !==
            this.translationService.options.fallbackLocale
        ) {
            content = await this.loadContentForLanguage(
                this.translationService.options.fallbackLocale!,
                type,
                root,
                group,
                name
            );
        }
        return content;
    }

    private async loadContentForLanguage(
        language: string,
        type: ContentType,
        root: string,
        group: string,
        name: string
    ): Promise<string | null> {
        let fullPath = root + (root.endsWith("/") ? "" : "/") + group + "/" + language + "." + name + "." + this.getExtension(type);
        try {
            let response = await this.apiService.get(fullPath, {
                baseURL: "/"
            });
            if (response.status === 200) {
                let content = response.data as string;
                let markdown = type === "MARKDOWN";
                if (this.options.convertContent) {
                    content = this.options.convertContent(type, content);
                }
                return content;
            } else {
                return response.data;
            }
        } catch {
            return null;
        }
    }
}