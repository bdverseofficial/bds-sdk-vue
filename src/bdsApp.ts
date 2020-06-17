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
import { CsService, CsOptions } from './services/csService';
import { SearchOptions, SearchService } from './services/searchService';
import { ForumOptions, ForumService } from './services/forumService';
import { HubService, HubOptions } from './services/hubService';
import { HubConnection } from '@microsoft/signalr';

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
    cs?: CsOptions;
    search?: SearchOptions;
    forum?: ForumOptions;
    translation?: TranslationOptions;
    api?: ApiOptions;
    bds?: BdsOptions;
    title?: string;
    appId?: string;
    hub?: HubOptions;
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
    public csService: CsService;
    public blogService: BlogService;
    public calendarService: CalendarService;
    public translationService: TranslationService;
    public forumService: ForumService;
    public searchService: SearchService;
    public hubService: HubService;

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
            options.router.onAfterEach = (route: Route) => this.onAfterEach(route);
        }
        if (!options.hub) options.hub = {};
        {
            options.hub.connectionCompleted = (connection: HubConnection) => this.onConnectionCompleted(connection);
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
            options.chat.onUpdateChannel = (channelKey: string) => this.onUpdateChannel(channelKey);
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
        this.hubService = new HubService(this.apiService, this.authService, this.configService, options.hub);
        this.searchService = new SearchService(this.configService, this.apiService, options.search);
        this.forumService = new ForumService(this.configService, this.apiService, options.forum);
        this.cmsService = new CmsService(this.apiService, this.authService, this.translationService, this.configService, this.hubService, options.cms);
        this.chatService = new ChatService(this.apiService, this.authService, this.configService, this.hubService, options.chat);
        this.blogService = new BlogService(this.apiService, options.blog);
        this.calendarService = new CalendarService(this.apiService, options.calendar);
        this.csService = new CsService(this.configService, this.apiService, options.cs);
        this.bdsService = new BdsService(this.configService, this.apiService, options.bds);

        this.title = options.title;
    }

    public start(mainVue: Vue): void {
        this.mainVue = mainVue;
    }

    protected onConnectionCompleted(connection: HubConnection): Promise<void> {
        this.chatService.onConnectionCompleted(connection);
        this.cmsService.onConnectionCompleted(connection);
        return Promise.resolve();
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
    }

    protected async onAfterEach(route: Route): Promise<void> {
        await this.cmsService.onRouteChange(route.query);
    }

    protected async onProfileChanged(): Promise<void> {
    }

    protected async onCatalogChanged(catalogKey: string, group: string): Promise<void> {
        if (this.mainVue) {
            this.mainVue.$emit("catalogchanged", catalogKey, group);
        }
    }

    protected async onChatChanged(channelKey: string): Promise<void> {
        if (this.mainVue) {
            this.mainVue.$emit("chatchanged", channelKey);
        }
    }

    protected async onUpdateChannel(channelKey: string): Promise<void> {
        if (this.mainVue) {
            this.mainVue.$emit("updateChannel", channelKey);
        }
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

    public async init(): Promise<void> {
        await this.configService.init();
        await this.translationService.init();
        await this.apiService.init();
        await this.profileService.init();
        await this.authService.init();
        await this.hubService.init();
        await this.csService.init();
        await this.cmsService.init();
        await this.chatService.init();
        await this.searchService.init();
        await this.forumService.init();
        await this.bdsService.init();
        await this.setLocale();
        this.ready = true;
    }
}