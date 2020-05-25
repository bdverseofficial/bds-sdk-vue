import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { TranslationService } from './translationService';
import { Source, ContentType, ContentMapItem, Content, ContentCatalog } from '../models/Cms';
import { HubConnection } from '@microsoft/signalr';
import _ from 'lodash';
import { AuthService } from './authService';
import { Route } from 'vue-router';
import { HubService } from './hubService';

export type CmsMode = "DEFAULT" | "NONE" | "LIVE";

export interface CmsStore {
    onCatalogChanged?: (catalogKey: string) => Promise<void>;
    mode: CmsMode;
}

export interface CmsOptions {
    localPath?: string;
    remotePath?: string;
    defaultSource?: Source;
    fallbackOnApi?: boolean;
    convertContent?: (type: ContentType, value: string) => string;
    onCatalogChanged?: (catalogKey: string, group: string) => Promise<void>;
    cmsQueryKey?: string;
    catalogKey?: string;
}

export class CmsService {

    private options: CmsOptions = {
        defaultSource: "Api",
        fallbackOnApi: true,
    };

    public store: CmsStore = {
        mode: "DEFAULT",
        onCatalogChanged: (catalogKey: string) => Promise.resolve(),
    };

    private regExp: RegExp = /[/\\?%*:|"<>]/g;
    private apiService: ApiService;
    private authService: AuthService;
    private configService: ConfigService;
    private translationService: TranslationService;
    private hubService: HubService;

    constructor(apiService: ApiService, authService: AuthService, translationService: TranslationService, configService: ConfigService, hubService: HubService, options?: CmsOptions) {
        this.apiService = apiService;
        this.hubService = hubService;
        this.authService = authService;
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

    public async startLiveUpdate() {
        this.store.mode = "LIVE";
        if (this.options.catalogKey) {
            await this.hubService.connect(this.options.catalogKey);
        }
    }

    public async stopLiveUpdate() {
        if (this.store.mode === "LIVE") this.store.mode = "DEFAULT";
        if (this.options.catalogKey) {
            await this.hubService.disconnect(this.options.catalogKey)
        }
    }

    async onConnectionCompleted(connection: HubConnection): Promise<void> {
        if (connection) {
            connection.on("RefreshCms", (catalogKey: string, group: string) =>
                this.onRefreshCatalog(catalogKey, group));
        }
    }

    private async onRefreshCatalog(catalogKey: string, group: string) {
        if (this.options.onCatalogChanged) {
            await this.options.onCatalogChanged!(catalogKey, group);
        }
    }

    public async loadContent(group: string, type?: ContentType, name?: string, source?: Source): Promise<string | string[] | null> {
        if (this.store.mode === "NONE") return null;
        if (this.store.mode === "LIVE" && source !== "Local") source = "Api";
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
        if (this.store.mode === "NONE") return null;
        if (this.store.mode === "LIVE" && source !== "Local") source = "Api";
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
        let response = await this.apiService.get("api/cms/v1/" + this.options.catalogKey + "/map/" + group, options);
        if (response) return response.data;
        return null;
    }

    private async getApiContentByName(group: string, name: string, options?: ApiRequestConfig): Promise<Content | null> {
        options = {
            ...options,
            headers: {
                filters: [
                    "CMS.Content:key|id|value|contentType|order"
                ].join(",")
            }
        };
        let response = await this.apiService.get("api/cms/v1/" + this.options.catalogKey + "/content/" + group + "/" + name, options);
        if (response) return response.data;
        return null;
    }

    public async onRouteChange(query: any): Promise<void> {
        if (this.options.cmsQueryKey && query) {
            let mode = query[this.options.cmsQueryKey];
            mode = (mode || "DEFAULT").toString().toUpperCase();
            this.store.mode = mode as CmsMode;
            switch (mode) {
                case "LIVE":
                    {
                        await this.startLiveUpdate();
                    }
                    break;
                default:
                    {
                        await this.stopLiveUpdate();
                    }
                    break;
            }
        }
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
            let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.options.catalogKey;
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
                let content = await this.getApiContentByName(
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
        if (type === "JSON") return "json";
        return "txt";
    }

    private async getRemoteContentMap(group: string): Promise<ContentMapItem[] | null> {
        if (group && this.options.remotePath) {
            let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.options.catalogKey;
            return await this.loadContentMap(remotePath, group);
        }
        return null;
    }

    private async loadGroupRemoteContent(group: string): Promise<string[] | null> {
        if (group && this.options.remotePath) {
            let map = await this.getRemoteContentMap(group);
            if (map) {
                map = _.orderBy(map, m => { return m.order ?? 0 });
                let remotePath = this.options.remotePath + (this.options.remotePath.endsWith("/") ? "" : "/") + this.options.catalogKey;
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
            fullPath = this.escapeFileNameAndPath(fullPath);
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

    private escapeFileNameAndPath(fileName: string): string {
        let result = fileName.split("/").map(p => this.escapeFileNamePart(p)).join("/");
        console.log(result);
        return result;
    }

    private escapeFileNamePart(part: string): string {
        return part.replace(this.regExp, "_");
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
            fullPath = this.escapeFileNameAndPath(fullPath);
            let response = await this.apiService.get(fullPath, {
                baseURL: "/",
                transformResponse: (d) => d,
            });
            if (response.status === 200) {
                let content = response.data as string;
                if (content) {
                    if (this.options.convertContent) {
                        content = this.options.convertContent(type, content);
                    }
                    return content;
                }
            }
            return response.data;
        } catch {
            return null;
        }
    }
}