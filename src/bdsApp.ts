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
import { CmsService, CmsOptions } from './services/cmsService';
import { ChatService, ChatOptions } from './services/chatService';
import { BlogOptions, BlogService } from './services/blogService';
import { CalendarOptions, CalendarService } from './services/calendarService';
import { ContentType } from './models/Cms';
import { Route } from 'vue-router';

export interface BdsAppOptions {
    config?: ConfigOptions;
    chat?: ChatOptions;
    blog?: BlogOptions;
    calendar?: CalendarOptions;
    cms?: CmsOptions;
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
    public cmsService: CmsService;
    public chatService: ChatService;
    public blogService: BlogService;
    public calendarService: CalendarService;
    public translationService: TranslationService;

    public title?: string;

    public ready: boolean = false;
    public mainVue: Vue | null = null;

    public options: BdsAppOptions = {
    }

    constructor(options: BdsAppOptions) {
        Vue.prototype.$app = this;
        this.options = options;
        if (!options.auth) options.auth = {};
        {
            options.auth!.signInCompleted = () => this.signInCompleted();
            options.auth!.signOutCompleted = () => this.signOutCompleted();
        }
        if (!options.router) options.router = {};
        {
            options.router.onBeforeEach = (to: Route, from: Route) => this.onBeforeEach(to, from);
        }
        if (!options.profile) options.profile = {};
        {
            options.profile.onProfileChanged = () => this.onProfileChanged();
        }
        if (!options.cms) options.cms = {};
        {
            options.cms.convertContent = (type: ContentType, content: string) => this.onConvertContent(type, content);
            options.cms.onCatalogChanged = (catalogKey: string, group: string) => this.onCatalogChanged(catalogKey, group);
        }
        if (!options.chat) options.chat = {};
        {
            options.chat.onChatChanged = (channelKey: string) => this.onChatChanged(channelKey);
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
        this.cmsService = new CmsService(this.apiService, this.translationService, this.configService, options.cms);
        this.chatService = new ChatService(this.apiService, this.configService, options.chat);
        this.blogService = new BlogService(this.apiService, options.blog);
        this.calendarService = new CalendarService(this.apiService, options.calendar);
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

    protected onConvertContent(type: ContentType, content: string): string {
        return content;
    }

    protected async onBeforeEach(to: Route, from: Route): Promise<void> {
        if (this.options.cms?.liveQueryToggle) {
            if (to.query[this.options.cms?.liveQueryToggle] !== undefined) {
                if (!this.cmsService.store.live) {
                    await this.cmsService.startLiveUpdate();
                }
            }
            else {
                if (this.cmsService.store.live) {
                    await this.cmsService.stopLiveUpdate();
                }
            }
        }
    }

    protected async onProfileChanged(): Promise<void> {
        // if (this.profileService.store.me && this.profileService.store.me.culture) {
        //     await this.setLocale(this.profileService.store.me.culture.id);
        // }
    }

    protected async onCatalogChanged(catalogKey: string, group: string): Promise<void> {
        // if (this.profileService.store.me && this.profileService.store.me.culture) {
        //     await this.setLocale(this.profileService.store.me.culture.id);
        // }
    }

    protected async onChatChanged(channelKey: string): Promise<void> {
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
        await this.cmsService.init();
        await this.chatService.init();
        await this.bdsService.init();
        await this.setLocale();
        this.ready = true;
    }
}