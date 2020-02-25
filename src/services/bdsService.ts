import { ApiService, ApiRequestConfig } from './apiService';
import { Token } from './authService';
import { BdsEntity } from '../models/BdsEntity';
import { Reference } from '../models/Reference';
import { Country, ConfigService } from '..';

export interface BdsOptions { }

export interface BdsStore {
    countries?: Country[];
}

export class BdsService {

    public options: BdsOptions = {};
    private apiService: ApiService;
    private configService: ConfigService;

    constructor(configService: ConfigService, apiService: ApiService, options?: BdsOptions) {
        this.options = { ...this.options, ...options };
        this.apiService = apiService;
        this.configService = configService;
    }

    public store: BdsStore = {
        countries: [],
    };

    public async init(): Promise<void> {
        let configs = await this.getConfig();
        this.configService.configuration = { ...this.configService.configuration, ...configs };
        this.store.countries = (await this.getCountries())!;
    }

    public toReferenceOrDefault(entity: BdsEntity): Reference | null {
        if (entity) {
            let ref = {
                id: entity.id,
                type: entity.type,
                displayName: entity.displayName
            } as Reference;
            return ref;
        }
        return null;
    }

    public toReferencesOrDefault(entities?: BdsEntity[]): Reference[] | null {
        if (entities) {
            return entities.map(e => this.toReferenceOrDefault(e)!);
        }
        return null;
    }

    private async getCountries(options?: ApiRequestConfig): Promise<Country[] | null> {
        let response = await this.apiService.get('api/bds/v1/app/countries', options);
        if (response) return response.data;
        return null;
    }

    private async getConfig(options?: ApiRequestConfig): Promise<any> {
        let response = await this.apiService.get('api/bds/v1/app/config', options);
        return response.data;
    }
}