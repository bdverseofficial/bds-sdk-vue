import { ApiService, ApiRequestConfig } from './apiService';
import { BlogPost, Blog } from '../models/Soc';

export interface BlogStore {
}

export interface BlogOptions {

}

export class BlogService {
    private options: BlogOptions = {
    };

    public store: BlogStore = {
    };

    private apiService: ApiService;

    constructor(apiService: ApiService, options?: BlogOptions) {
        this.apiService = apiService;
        this.options = { ...this.options, ...options };
    }

    async getBlogPosts(blogId: string, draft: boolean, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<BlogPost[] | null> {
        options = {
            ...options,
            headers: {
                filters: [
                    "SOC.BlogPost:key|id|meta|title|fullAvatar"
                ].join(",")
            }
        };
        let response = await this.apiService.get('api/soc/v1/blogs/' + blogId + "/posts", { ...options, params: { draft: draft, limit: limit, scrollId: scrollId } });
        if (response) return response.data;
        return null;
    }

    async getBlog(blogId: string, options?: ApiRequestConfig): Promise<Blog | null> {
        let response = await this.apiService.get('api/soc/v1/blogs/' + blogId, options);
        if (response) return response.data;
        return null;
    }

    async getBlogPost(blogId: string, postId: string, options?: ApiRequestConfig): Promise<BlogPost | null> {
        let response = await this.apiService.get('api/soc/v1/blogs/' + blogId + "/post/" + postId, options);
        if (response) return response.data;
        return null;
    }

    async putBlogPost(blogId: string, post: BlogPost, options?: ApiRequestConfig): Promise<BlogPost | null> {
        const response = await this.apiService.put('api/soc/v1/blogs/' + blogId + '/post', post, options);
        return response.data;
    }

    async updateBlogPost(blogId: string, postId: string, post: BlogPost, options?: ApiRequestConfig): Promise<BlogPost | null> {
        const response = await this.apiService.post('api/soc/v1/blogs/' + blogId + '/post/' + postId, post, options);
        return response.data;
    }

    async deleteBlogPost(blogId: string, postId: string, options?: ApiRequestConfig): Promise<BlogPost | null> {
        const response = await this.apiService.delete('api/soc/v1/blogs/' + blogId + '/post/' + postId, options);
        return response.data;
    }
}