import { ApiService, ApiRequestConfig } from './apiService';
import { User, Phone, TwoFactorAuthentication } from '../models/User';
import { ChallengedRequest } from './authService';
import { ConfigService } from './configService';
import { Asset } from '../models/Asset';

export interface ProfileOptions {
    getUserInfoApi?: () => Promise<any>;
    onProfileChanged?: () => Promise<void>;
}

export interface ProfileStore {
    me?: User;
    roles?: string[];
}

export interface ChangeMeLoginRequest extends ChallengedRequest {
    login: string;
}

export interface ChangeMePhoneRequest extends ChallengedRequest {
    phone: Phone;
}

export interface ChangeMeTwoFactorRequest extends ChallengedRequest {
    twoFactorAuthentication: TwoFactorAuthentication;
}

export interface ChangeMeEmailRequest extends ChallengedRequest {
    email: string;
    activationUrl?: string;
    mailTemplateId?: string;
}

export interface ChangeMePasswordRequest extends ChallengedRequest {
    oldPassword: string;
    newPassword: string;
}

export class ProfileService {

    private apiService: ApiService;
    private configService: ConfigService;

    public store: ProfileStore = {
        me: undefined,
    };

    private options: ProfileOptions = {
        onProfileChanged: () => Promise.resolve(),
    };

    constructor(apiService: ApiService, configService: ConfigService, options?: ProfileOptions) {
        this.apiService = apiService;
        this.configService = configService;
        this.options = { ...this.options, ...options };
    }

    public async init(): Promise<void> {
    }

    public async getUserProfile(): Promise<void> {
        if (this.store) {
            this.store.me = await this.getUserInfo();
            if (this.store.me && this.store.me.clientApplicationUserRoles) {
                this.store.roles = this.getUserRoles(this.store.me)!;
            }
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
        }
    }

    public getUserRoles(user: User): string[] | null {
        if (user && user.clientApplicationUserRoles) {
            return user.clientApplicationUserRoles.filter(g => g.application && g.application.id === this.configService.configuration?.appId && g.role).map(g => g.role!);
        }
        return null;
    }

    public async getUserInfo(options?: ApiRequestConfig): Promise<User> {
        let response = await this.apiService.get('api/bds/v1/users/me', options);
        return response.data;
    }

    public async updateUserInfo(user: User, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me', user, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public async updateAvatar(asset: Asset, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/avatar', asset, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public async updatePhone(phoneRequest: ChangeMePhoneRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/changephone', phoneRequest, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    async registerUser(member: User, password: string, options?: ApiRequestConfig): Promise<User | undefined> {
        const request = {
            user: member,
            password: password,
        };
        const response = await this.apiService.post('api/bds/v1/users/register', request, options);
        return response.data;
    }

    public async updateLogin(loginRequest: ChangeMeLoginRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/changelogin', loginRequest, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public async updateTwoFactor(twoFactorRequest: ChangeMeTwoFactorRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/changetwofactor', twoFactorRequest, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public async updatePassword(passwordRequest: ChangeMePasswordRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/changepassword', passwordRequest, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public async updateEmail(emailRequest: ChangeMeEmailRequest, options?: ApiRequestConfig): Promise<User | undefined> {
        let response = await this.apiService.post('api/bds/v1/users/me/changeemail', emailRequest, options);
        if (response.data) {
            this.store!.me = response.data;
            if (this.options.onProfileChanged) await this.options.onProfileChanged!();
            return response.data;
        }
        return undefined;
    }

    public isInOneOfRoles(roles: string[]): boolean {
        return roles.filter(r => this.isInRole(r)).length > 0;
    }

    public isInRole(role: string): boolean {
        if (this.store && this.store.roles) {
            if (this.store.roles.find(r => r === "SYSADMIN")) return true;
            if (this.store.roles.find(r => r === role)) return true;
        }
        return false;
    }

    public isInOneOfRolesForUser(user: User, roles: string[]): boolean {
        if (user) {
            return roles.filter(r => this.isInRoleForUser(user, r)).length > 0;
        }
        return false;
    }

    public isInRoleForUser(user: User, role: string): boolean {
        let assignedroles = this.getUserRoles(user)!;
        if (assignedroles) {
            if (assignedroles.find(r => r === "SYSADMIN")) return true;
            if (assignedroles.find(r => r === role)) return true;
        }
        return false;
    }

    public clearUserProfile(): void {
        if (this.store && this.store.me) {
            this.store.me = undefined;
            this.store.roles = undefined;
            this.options.onProfileChanged!();
        }
    }
}