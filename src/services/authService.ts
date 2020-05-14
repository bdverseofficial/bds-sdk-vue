import { ConfigService } from './configService';
import { ApiRequestConfig, ApiService } from './apiService';
import { User } from '../models/User';

export interface AuthStore {
    isAuthenticated: boolean;
}

export interface Token {
    deviceId?: string;
    appId?: string;
    clientId?: string;
    refresh_token?: string;
    token_type?: string;
    access_token?: string;
    identityProvider?: string;
    device_token?: string;
    expires_in?: number;
}

export interface ChallengeMethod {
    method?: string;
    target?: string;
    selected?: boolean;
}

export interface Challenge {
    date?: Date;
    hash?: string;
    methods?: ChallengeMethod[];
}

export interface ChallengeRequest {
    code?: string;
    date?: Date;
    hash?: string;
}

export interface ChallengedRequest {
    challenge?: ChallengeRequest;
}

export interface UserRequest {
    typeName?: string;
    userName: string;
}

export interface ExternalTokenRequest {
    refreshToken?: string;
    deviceToken?: string;
    provider?: string;
    typeName?: string;
}

export interface RefreshTokenRequest {
    refreshToken?: string;
    deviceToken?: string;
}

export interface LoginRequest extends ChallengedRequest, UserRequest {
    password: string;
    challenge?: ChallengeRequest;
    deviceToken?: string;
}

export interface ResetPasswordRequest {
    token?: string;
    login?: LoginRequest;
    password: string;
}

export interface ForgotPasswordRequest extends UserRequest {
    resetUrl?: string;
    mailTemplateId?: string;
}

export interface SendActivationRequest extends UserRequest {
    activationUrl?: string;
    mailTemplateId?: string;
}

export interface NewChallengeRequest extends LoginRequest {
    method: string;
}

export interface AuthOptions {
    signInCompleted?: () => Promise<void>;
    signOutCompleted?: () => Promise<void>;
    refreshOnInit?: boolean;
}

export class AuthService {

    public store: AuthStore = {
        isAuthenticated: false,
    };

    public challengeMethods: ChallengeMethod[] = [];

    private refreshTimeout?: number;
    private token?: Token;
    private rememberMe: boolean;
    private configService: ConfigService;

    public apiService?: ApiService;
    private options: AuthOptions = {
        signInCompleted: () => Promise.resolve(),
        signOutCompleted: () => Promise.resolve(),
        refreshOnInit: false,
    };

    private externalSignOut?: () => Promise<void>;

    constructor(configService: ConfigService, options?: AuthOptions) {
        this.configService = configService;
        this.token = undefined;
        this.rememberMe = false;
        this.options = { ...this.options, ...options };
    }

    private tryParseToken(token?: string): Token | undefined {
        try {
            return JSON.parse(token!);
        } catch {
            return undefined;
        }
    }

    private async validateToken(refreshToken: string): Promise<void> {
        this.token = undefined;
        this.store!.isAuthenticated = false;
        await this.refreshToken(refreshToken);
        if (this.token && this.options.signInCompleted) {
            await this.options.signInCompleted();
        }
    }

    private getStorage(): Storage {
        return this.rememberMe ? localStorage : sessionStorage;
    }

    private saveToken() {
        if (this.token) {
            this.getStorage().setItem("refresh_token", this.token.refresh_token!);
            if (this.token.device_token) this.getStorage().setItem("device_token", this.token.device_token);
        }
    }

    public async signOut(keepStorage: boolean, soft?: boolean): Promise<void> {
        this.token = undefined;
        if (this.refreshTimeout) window.clearTimeout(this.refreshTimeout);
        if (!keepStorage) {
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('refresh_token');
        }
        if (soft && this.externalSignOut) {
            await this.externalSignOut();
        }
        if (this.store!.isAuthenticated) {
            this.store!.isAuthenticated = false;
            await this.options.signOutCompleted!();
        }
    }

    public async signIn(request: LoginRequest, rememberMe?: boolean, options?: ApiRequestConfig): Promise<void> {
        this.rememberMe = rememberMe || false;
        this.token = undefined;
        this.store.isAuthenticated = this.token ? true : false;
        let deviceToken = this.getStorage().getItem("device_token");
        if (deviceToken) {
            request.deviceToken = deviceToken;
        }
        this.token = await this.signInApi(request, options);
        this.store.isAuthenticated = this.token ? true : false;
        this.saveToken();
        this.scheduleRefreshToken();
        if (this.options.signInCompleted) await this.options.signInCompleted!();
    }

    private scheduleRefreshToken() {
        if (this.refreshTimeout) {
            window.clearTimeout(this.refreshTimeout);
            this.refreshTimeout = undefined;
        }
        let timeSpan = 30000;
        if (this.token && this.token.expires_in) {
            timeSpan = (this.token.expires_in / 2) * 1000;
        }
        this.refreshTimeout = window.setTimeout(async () => { await this.refreshToken(); }, timeSpan);
    }

    private async refreshToken(refreshToken?: string): Promise<void> {
        let localToken = (refreshToken || (this.token ? this.token.refresh_token : undefined))!;
        try {
            let request = {
                refreshToken: localToken,
            } as RefreshTokenRequest;
            let deviceToken = this.getStorage().getItem("device_token");
            if (deviceToken) {
                request.deviceToken = deviceToken;
            }
            let newToken = await this.refreshTokenApi(request);
            this.token = newToken;
            this.store!.isAuthenticated = this.token ? true : false;
            this.saveToken();
            this.scheduleRefreshToken();
        } catch (e) {
            let code = e.underlyingError ? e.underlyingError.response.status : e.errorCode;
            if (code === 401 || code === 403) {
                await this.signOut(true, true);
            }
            else {
                this.scheduleRefreshToken();
            }
        }
    }

    public async createTokenExternalProviderToken(provider: string, token: string, signOut: () => Promise<void>) {
        try {
            let request = {
                token: token,
                provider: provider
            } as ExternalTokenRequest;
            this.externalSignOut = signOut;
            let deviceToken = this.getStorage().getItem("device_token");
            if (deviceToken) {
                request.deviceToken = deviceToken;
            }
            this.token = await this.createTokenExternalProviderTokenApi(request);
            this.store!.isAuthenticated = this.token ? true : false;
            this.saveToken();
            this.scheduleRefreshToken();
            if (this.options.signInCompleted) await this.options.signInCompleted!();
        } catch {
            await this.signOut(true, true);
        }
    }

    public async signInFromExternalProvider(provider: string, token: string): Promise<void> {
        let request = {
            token: token,
            provider: provider
        } as ExternalTokenRequest;
        let deviceToken = this.getStorage().getItem("device_token");
        if (deviceToken) {
            request.deviceToken = deviceToken;
        }
        this.token = await this.signInFromExternalProviderApi(request);
        this.store!.isAuthenticated = this.token ? true : false;
        if (this.options.signInCompleted) await this.options.signInCompleted!();
    }

    public async init(): Promise<void> {
        this.getChallengeMethods().then((value) => { this.challengeMethods = value!; }, (value) => { this.challengeMethods = [] }).catch(() => { });
        if (this.options.refreshOnInit) {
            this.TryAutoAuth().catch(() => { });
        }
    }

    public async TryAutoAuth(): Promise<void> {
        let refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) this.rememberMe = true;
        if (!refreshToken) refreshToken = sessionStorage.getItem('refresh_token');
        if (refreshToken) {
            await this.validateToken(refreshToken);
        }
    }

    public getHeaders(): any {
        let headers: any = {};
        if (this.configService.configuration?.apiToken) {
            headers['ApiToken'] = this.configService.configuration.apiToken;
        }
        return headers;
    }

    public getAccessToken(): string | undefined {
        if (this.token) {
            return this.token.access_token;
        }
    }

    public getAuthHeaders(): any {
        if (this.token) {
            let headers: any = {};
            headers['Authorization'] = this.token.token_type + ' ' + this.token.access_token;
            return headers;
        }
        return undefined;
    }

    public async getChallengeCode(request: NewChallengeRequest, options?: ApiRequestConfig): Promise<Challenge | undefined> {
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        if (request.typeName) {
            let response = await this.apiService!.post('api/bds/v1/users/challengecode', request, options);
            if (response.data) {
                return response.data as Challenge;
            }
        }
        return undefined;
    }

    private async signInApi(request: LoginRequest, options?: ApiRequestConfig): Promise<Token | undefined> {
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        if (request.typeName) {
            let response = await this.apiService!.post('api/bds/v1/users/signin', request, options);
            if (response.data) {
                return response.data.token as Token;
            }
        }
        return undefined;
    }

    public async getChallengeMethods(options?: ApiRequestConfig): Promise<ChallengeMethod[] | undefined> {
        let response = await this.apiService!.get('api/bds/v1/users/challengemethods', options);
        return response.data;
    }

    public async sendActivation(request: SendActivationRequest, options?: ApiRequestConfig): Promise<any> {
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        if (request.typeName) {
            let response = await this.apiService!.post('api/bds/v1/users/sendactivation', request, options);
            return response.data;
        }
        return undefined;
    }

    public async forgotPassword(request: ForgotPasswordRequest, options?: ApiRequestConfig): Promise<any> {
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        if (request.typeName) {
            let response = await this.apiService!.post('api/bds/v1/users/forgotpassword', request, options);
            return response.data;
        }
        return undefined;
    }

    public async validateCommunicationToken(token: string, options?: ApiRequestConfig): Promise<User | undefined> {
        let request = {
            token: token,
        };
        let response = await this.apiService!.post('api/bds/v1/users/validatecommunicationToken', request, options);
        return response.data;
    }

    public async activation(token: string, options?: ApiRequestConfig): Promise<User | undefined> {
        let request = {
            token: token,
        };
        let response = await this.apiService!.post('api/bds/v1/users/activation', request, options);
        return response.data;
    }


    public async resetPassword(request: ResetPasswordRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        if (this.configService.configuration && request.login) {
            request.login.typeName = request.login.typeName || this.configService.configuration.userTypeName;
        }
        let response = await this.apiService!.post('api/bds/v1/users/resetpassword', request, options);
        return response.data;
    }

    private async refreshTokenApi(request: RefreshTokenRequest, options?: ApiRequestConfig): Promise<Token | undefined> {
        let newToken: Token | undefined;
        const response = await this.apiService!.post('api/bds/v1/users/token', request, { withCredentials: false, silentError: true, ...options });
        if (response.data) {
            newToken = response.data as Token;
        }
        return newToken;
    }

    private async createTokenExternalProviderTokenApi(request: ExternalTokenRequest, options?: ApiRequestConfig): Promise<Token | undefined> {
        let newToken: Token | undefined;
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        const response = await this.apiService!.post('api/bds/v1/users/externaltoken', request, { withCredentials: false, silentError: true, ...options });
        if (response.data) {
            newToken = response.data as Token;
        }
        return newToken;
    }

    private async signInFromExternalProviderApi(request: ExternalTokenRequest, options?: ApiRequestConfig): Promise<Token | undefined> {
        if (this.configService.configuration) {
            request.typeName = request.typeName || this.configService.configuration.userTypeName;
        }
        const response = await this.apiService!.post('api/bds/v1/users/externalsignIn', request, { withCredentials: false, silentError: true, ...options });
        if (response.data) {
            return response.data as Token;
        }
    }
}