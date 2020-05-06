import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { Thread, Topic, Post } from '../models/Soc';

export interface ForumOptions {
}

export interface ForumStore {
}

export class ForumService {

    private options: ForumOptions = {
    };

    private apiService: ApiService;
    private configService: ConfigService;

    public store: ForumStore = {
    };

    constructor(configService: ConfigService, apiService: ApiService, options?: ForumOptions) {
        this.apiService = apiService;
        this.configService = configService;
    }

    public async init() {
    }

    public async getTopics(limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Topic[] | null> {
        let response = await this.apiService.get('api/soc/v1/forum/topics', { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    public async getTopic(topicId: string, options?: ApiRequestConfig): Promise<Topic | null> {
        let response = await this.apiService.get('api/soc/v1/forum/topics/' + topicId, options);
        if (response) return response.data;
        return null;
    }

    public async getThreads(topicId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Thread[] | null> {
        let response = await this.apiService.get('api/soc/v1/forum/topics/' + topicId + "/threads", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    public async getThread(threadId: string, options?: ApiRequestConfig): Promise<Thread | null> {
        let response = await this.apiService.get('api/soc/v1/forum/threads/' + threadId, options);
        if (response) return response.data;
        return null;
    }

    public async getPosts(threadId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Post[] | null> {
        let response = await this.apiService.get('api/soc/v1/forum/threads/' + threadId + "/posts", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }
}