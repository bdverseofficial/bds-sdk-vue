import Vue from "vue";
import { ConfigService, ConfigOptions } from "./services/configService";
import { AuthOptions, AuthService, Token } from './services/authService';
import { ErrorOptions, ErrorService, BdsError } from './services/errorService';
import { ProfileOptions, ProfileService } from './services/profileService';
import { RouterOptions, RouterService } from './services/routerService';
import { ApiService, ApiOptions } from './services/apiService';
import { LoadingService } from './services/loadingService';
import { BdsOptions, BdsService } from './services/bdsService';
import { TranslationOptions, TranslationService } from './services/translationService';
import { LocaleMessageObject } from 'vue-i18n';

export interface BdsAppOptions {
    config?: ConfigOptions;
    auth?: AuthOptions;
    error?: ErrorOptions;
    router?: RouterOptions;
    profile?: ProfileOptions;
    translation?: TranslationOptions;
    api?: ApiOptions;
    bds?: BdsOptions;
    title?: string;
    appId?: string;
}

export class BdsApp {

    public configService: ConfigService;
    public authService: AuthService;
    public apiService: ApiService;
    public bdsService: BdsService;
    public errorService: ErrorService;
    public loadingService: LoadingService;
    public profileService: ProfileService;
    public routerService: RouterService;
    public translationService: TranslationService;

    public title?: string;

    public ready: boolean = false;
    public mainVue: Vue | null = null;

    constructor(options: BdsAppOptions) {
        Vue.prototype.$app = this;

        if (!options.auth) options.auth = {};
        {
            options.auth!.signInCompleted = () => this.signInCompleted();
            options.auth!.signOutCompleted = () => this.signOutCompleted();
        }
        if (!options.api) options.api = {};
        {
            options.api.appId = options.appId;
        }
        if (!options.profile) options.profile = {};
        {
            options.profile.appId = options.appId;
            options.profile.onProfileChanged = () => this.onProfileChanged();
        }
        if (!options.error) options.error = {};
        {
            options.error.errorHandler = (context: string, error: BdsError) => this.errorHandler(context, error);
        }
        if (!options.translation) options.translation = {};
        {
            options.translation.getLang = (lang) => this.getLang(lang);
        }

        this.configService = new ConfigService(options.config);
        this.authService = new AuthService(this.configService, options.auth);
        this.loadingService = new LoadingService();
        this.errorService = new ErrorService(options.error);
        this.apiService = new ApiService(this.configService, this.loadingService, this.authService, this.errorService, options.api);
        this.profileService = new ProfileService(this.apiService, this.configService, options.profile);
        this.routerService = new RouterService(this.authService, this.profileService, options.router);
        this.translationService = new TranslationService(this.apiService, this.configService, options.translation);
        this.bdsService = new BdsService(this.configService, this.apiService, options.bds);

        this.title = options.title;
    }

    public start(mainVue: Vue) {
        this.mainVue = mainVue;
    }

    protected errorHandler(context: string, error: BdsError): Promise<void> {
        alert(context + " : " + error.errorCode + " : " + error.developerMessage);
        return Promise.resolve();
    }

    protected getLang(lang: string): Promise<LocaleMessageObject | undefined> {
        return Promise.resolve(undefined);
    }

    protected async onProfileChanged(): Promise<void> {
        // if (this.profileService.store.me && this.profileService.store.me.culture) {
        //     await this.setLocale(this.profileService.store.me.culture.id);
        // }
    }

    protected signInCompleted(): Promise<void> {
        return this.profileService.getUserProfile();
    }

    protected signOutCompleted(): Promise<void> {
        this.profileService.clearUserProfile();
        this.routerService.redirectToLoginIfNeeded();
        return Promise.resolve();
    }

    public async setLocale(lang?: string): Promise<string> {
        if (!lang) lang = localStorage.getItem("lang")!;
        lang = await this.translationService.setLocale(lang);
        this.apiService.setDefaultLocale(lang!);
        localStorage.setItem("lang", lang);
        return lang!;
    }

    public async init() {
        await this.configService.init();
        await this.translationService.init();
        await this.apiService.init();
        await this.profileService.init();
        await this.authService.init();
        await this.bdsService.init();
        await this.setLocale();
        this.ready = true;
    }
}