import axios from 'axios';
import { CmsOptions } from './cmsService';
import { CsOptions } from './csService';

export interface Configuration {
    appId?: string;
    serverUrl?: string;
    apiToken?: string;
    defaultLocale?: string;
    supportedLocale?: string[];
    userTypeName?: string;
    cms?: CmsOptions;
    cs?: CsOptions;
}

export interface ConfigOptions {
    configPath?: string;
    configuration?: Configuration;
}

export class ConfigService {

    private options: ConfigOptions = {
        configPath: "/configs/config.json",
    };

    public configuration?: Configuration;

    constructor(options?: ConfigOptions) {
        this.options = { ...this.options, ...options };
    }

    public async init(): Promise<void> {
        if (!this.options.configuration) {
            await axios.create().get(this.options.configPath!).then((response) => { this.configuration = response.data });
        }
    }
}