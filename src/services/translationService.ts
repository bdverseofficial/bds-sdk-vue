import Vue from 'vue';
import { ApiService } from './apiService';
import VueI18n, { LocaleMessageObject } from 'vue-i18n';
import { ConfigService } from './configService';

Vue.use(VueI18n);

export interface TranslationOptions {
    locale?: string;
    fallbackLocale?: string;
    supportedLocale?: string[];
    getLang?: (lang: string) => Promise<LocaleMessageObject | undefined>;
}

const DEFAULTLOCALE: string = 'en';

export class TranslationService {

    public options: TranslationOptions = {
    };

    public i18n: VueI18n;
    private apiService: ApiService;
    private configService: ConfigService;
    private loadedLanguages: string[] = [];

    constructor(apiService: ApiService, configService: ConfigService, options?: TranslationOptions) {
        this.configService = configService;
        this.apiService = apiService;
        if (options) {
            this.options.locale = options.locale || this.options.locale;
            this.options.fallbackLocale = options.fallbackLocale || this.options.fallbackLocale;
            this.options.supportedLocale = options.supportedLocale || this.options.supportedLocale;
            this.options.getLang = options.getLang || this.options.getLang;
        }
        this.i18n = new VueI18n({
            locale: '',
        });
    }

    public async init() {
        let config = this.configService.configuration!;
        this.options.locale = (this.options.locale || config.defaultLocale) || DEFAULTLOCALE;
        this.options.fallbackLocale = (this.options.fallbackLocale || config.defaultLocale) || DEFAULTLOCALE;
        this.options.supportedLocale = this.options.supportedLocale || config.supportedLocale;
        this.options.supportedLocale = this.options.supportedLocale || (config.defaultLocale ? [config.defaultLocale!] : [DEFAULTLOCALE]);
        this.i18n.fallbackLocale = this.options.fallbackLocale;
        if (this.options.fallbackLocale) {
            await this.loadLang(this.options.fallbackLocale);
        }
    }

    public t(key: VueI18n.Path): string {
        return this.i18n.t(key).toString();
    }

    private setI18nLanguage(lang: string) {
        this.i18n.locale = lang;
        document.querySelector('html')!.setAttribute('lang', lang);
        return lang;
    }

    public getClosestLocale(lang?: string): string {
        if (lang) {
            if (this.options.supportedLocale!.includes(lang)) return lang;
            lang = lang.split('-')[0];
            if (this.options.supportedLocale!.includes(lang)) return lang;
        }
        return this.options.fallbackLocale!;
    }

    private async loadLang(lang: string) {
        let msgs = (this.options.getLang) ? await this.options.getLang(lang) : undefined;
        if (msgs) {
            this.i18n.setLocaleMessage(lang, msgs);
            this.loadedLanguages.push(lang);
        }
    }

    public async setLocale(lang?: string): Promise<string> {
        if (!lang) lang = this.options.locale;
        lang = this.getClosestLocale(lang);
        if (this.i18n.locale !== lang) {
            if (!this.loadedLanguages.includes(lang)) {
                await this.loadLang(lang);
            }
            return this.setI18nLanguage(lang);
        }
        return lang!;
    }
}
