import axios from 'axios';
import { CmsOptions } from './cmsService';

export interface Configuration {
    appId?: string;
    serverUrl?: string;
    apiToken?: string;
    refreshTokenTimeSpanSecond?: number;
    defaultLocale?: string;
    supportedLocale?: string[];
    userTypeName?: string;
    cms?: CmsOptions;
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
        if (options) {
            this.options.configPath = options.configPath || this.options.configPath;
            this.options.configuration = options.configuration || this.options.configuration;
        }
    }

    public async init() {
        if (!this.options.configuration) {
            await axios.create().get(this.options.configPath!).then((response) => { this.configuration = response.data });
        }
    }
}