import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { Thread, Topic, Post } from '../models/Soc';
import { SearchEntityResponse } from '../models/Search';

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
        let response = await this.apiService.get('api/soc/v1/forum/topic/' + topicId, options);
        if (response) return response.data;
        return null;
    }

    public async getThreads(topicId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Thread[] | null> {
        let response = await this.apiService.get('api/soc/v1/forum/topic/' + topicId + "/threads", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    public async getThread(threadId: string, options?: ApiRequestConfig): Promise<Thread | null> {
        let response = await this.apiService.get('api/soc/v1/forum/' + threadId, options);
        if (response) return response.data;
        return null;
    }

    public async getPosts(threadId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Post[] | null> {
        options = {
            ...options,
            headers: {
                filters: [
                    "SOC.BlogPost:key|id|meta|title|fullAvatar"
                ].join(",")
            }
        };
        let response = await this.apiService.get('api/soc/v1/forum/' + threadId + "/posts", { ...options, params: { limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    async putThread(topicId: string, thread: Thread, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.put('api/soc/v1/forum/topic/' + topicId + '/thread', thread, options);
        return response.data;
    }

    async updateThread(topicId: string, threadId: string, thread: Thread, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.post('api/soc/v1/forum/topic/' + topicId + '/thread/' + threadId, thread, options);
        return response.data;
    }

    async deleteThread(topicId: string, threadId: string, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.delete('api/soc/v1/forum/topic/' + topicId + '/thread/' + threadId, options);
        return response.data;
    }

    async putPost(threadId: string, post: Post, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.put('api/soc/v1/forum/' + threadId + '/post', post, options);
        return response.data;
    }

    async updatePost(threadId: string, postId: string, post: Post, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.post('api/soc/v1/forum/' + threadId + '/post/' + postId, post, options);
        return response.data;
    }

    async deletePost(threadId: string, postId: string, options?: ApiRequestConfig): Promise<Post | null> {
        const response = await this.apiService.delete('api/soc/v1/forum/' + threadId + '/post/' + postId, options);
        return response.data;
    }

    async getPost(threadId: string, postId: string, options?: ApiRequestConfig): Promise<Post | null> {
        let response = await this.apiService.get('api/soc/v1/forum/' + threadId + "/post/" + postId, options);
        if (response) return response.data;
        return null;
    }

    public async searchForum(request: any): Promise<SearchEntityResponse | null> {
        let options = {
            headers: {
                filters: [
                    "Facet:name|localName",
                    "FacetValue:name|localName",
                ].join(",")
            }
        };
        return await this.searchForumApi(request, options);
    }

    private async searchForumApi(request: any, options?: ApiRequestConfig): Promise<SearchEntityResponse | null> {
        if (request) {
            if (this.configService.configuration) {
                let response = await this.apiService.post(
                    "api/soc/v1/forum/search",
                    request,
                    options
                );
                return response.data;
            }
        }
        return null;
    }
}