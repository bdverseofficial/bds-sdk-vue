import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { SearchEntityResponse, SearchRequest, SearchEntityRequest } from '../models/Search';

export interface SearchOptions {
}

export interface SearchStore {
}

export class SearchService {

    private options: SearchOptions = {
    };

    private apiService: ApiService;
    private configService: ConfigService;

    public store: SearchStore = {
    };

    constructor(configService: ConfigService, apiService: ApiService, options?: SearchOptions) {
        this.apiService = apiService;
        this.configService = configService;
    }

    public async init(): Promise<void> {
    }

    public async searchFullText(request: SearchEntityRequest, options?: ApiRequestConfig): Promise<SearchEntityResponse | null> {
        if (request) {
            let response = await this.apiService.post('api/bds/v1/search', request, options);
            return response.data;
        }
        return null;
    }
}