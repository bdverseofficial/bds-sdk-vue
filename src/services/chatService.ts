import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Dictionary, Channel, SocUser, Message } from '../models/Soc';
import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { HubConnection } from '@microsoft/signalr';
import _ from 'lodash';
import { AuthService } from './authService';
import { HubService } from './hubService';

export interface ChatStore {
    channelKeys: string[];
    channels: Dictionary<Channel>;
    users: Dictionary<SocUser>;
    emojies: any;
}

export interface ChatOptions {
    emojiPath?: string;
    onChatChanged?: (channelKey: string) => Promise<void>;
    onUpdateChannel?: (channelKey: string) => Promise<void>;
}

export class ChatService {
    private options: ChatOptions = {
        onChatChanged: (channelKey: string) => Promise.resolve(),
        onUpdateChannel: (channelKey: string) => Promise.resolve(),
    };

    public store: ChatStore = {
        channelKeys: [],
        channels: {},
        users: {},
        emojies: null,
    };

    private apiService: ApiService;
    private authService: AuthService;
    private configService: ConfigService;
    private httpService: AxiosInstance;
    private hubService: HubService;

    constructor(apiService: ApiService, authService: AuthService, configService: ConfigService, hubService: HubService, options?: ChatOptions) {
        this.apiService = apiService;
        this.hubService = hubService;
        this.configService = configService;
        this.authService = authService;
        this.options = { ...this.options, ...options };
        this.httpService = Axios.create();
    }

    public async init(): Promise<void> {
        if (this.options.emojiPath) {
            this.apiService.get(this.options.emojiPath, {
                baseURL: "/"
            }).then(response => {
                let groups = _.groupBy(response.data, "group");
                this.store.emojies = Object.keys(groups).map(k => { return { char: groups[k][0].char, emojies: groups[k].map(kk => kk.char) }; });
            }, () => { }).catch(() => { });
        }
    }

    public async clearUser(): Promise<void> {
        for (let channelKey of this.store.channelKeys) {
            await this.hubService.disconnect(channelKey);
        }
        this.store.channelKeys = [];
    }

    public async initUser(channelKeys: string[]): Promise<void> {
        this.store.channelKeys = channelKeys;
        for (let channelKey of this.store.channelKeys) {
            await this.hubService.connect(channelKey);
        }
    }

    async onConnectionCompleted(connection: HubConnection): Promise<void> {
        connection.on("RefreshChats", (channelKey: string) =>
            this.onRefreshChanel(channelKey));
        connection.on("UpdateChannel", (channelKey: string) =>
            this.onUpdateChanel(channelKey));
    }

    public getChat(channelKey: string): Channel | undefined {
        let chat = this.store.channels[channelKey];
        return chat;
    }

    private async onUpdateChanel(channelKey: string) {
        let channel = await this.getChannel(channelKey);
        if (channel) {
            this.store.channels[channelKey] = channel;
        }
        if (this.options.onUpdateChannel) {
            await this.options.onUpdateChannel!(channelKey);
        }
    }

    private async onRefreshChanel(channelKey: string) {
        if (this.store.channels[channelKey]) {
            this.store.channels[channelKey].newMessages = true;
        }
        if (this.options.onChatChanged) {
            await this.options.onChatChanged!(channelKey);
        }
    }

    public markChannelRefreshed(channelKey: string): void {
        if (this.store.channels[channelKey]) {
            this.store.channels[channelKey].newMessages = false;
        }
    }

    public async getLinkPreview(uri: string, options?: AxiosRequestConfig): Promise<any> {
        let response = await this.httpService.get('https://api.linkpreview.net/', { ...options, params: { key: '6f361642b81db6313e997b067ef7066d', q: uri } });
        if (response) return response.data;
        return null;
    }

    public async getChannel(channelId: string, options?: ApiRequestConfig): Promise<Channel | null> {
        let response = await this.apiService.get('api/soc/v1/chats/' + channelId, options);
        if (response) return response.data;
        return null;
    }

    public async getNewMessages(channelId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Message[] | null> {
        let response = await this.apiService.get('api/soc/v1/chats/' + channelId + "/newmessages", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    public async getOldMessages(channelId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Message[] | null> {
        let response = await this.apiService.get('api/soc/v1/chats/' + channelId + "/oldmessages", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    public async putMessage(channelId: string, message: Message, options?: ApiRequestConfig): Promise<Message | null> {
        const response = await this.apiService.put('api/soc/v1/chats/' + channelId + '/message', message, options);
        return response.data;
    }

    public async deleteMessage(channelId: string, messageId: string, options?: ApiRequestConfig): Promise<void> {
        const response = await this.apiService.delete('api/soc/v1/chats/' + channelId + '/message/' + messageId, options);
        return response.data;
    }

    public async toggleLock(channelId: string, options?: ApiRequestConfig): Promise<Channel | null> {
        const response = await this.apiService.post('api/soc/v1/chats/' + channelId + '/toggleLock', null, options);
        return response.data;
    }
}