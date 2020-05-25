/*
   API Service
   The API service is used to low level interface with bds Server
*/

import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from './configService';
import { LoadingService } from './loadingService';
import { AuthService, Token } from './authService';
import { ErrorService, BdsError } from './errorService';
import Fingerprint2 from 'fingerprintjs2';

export interface ApiRequestConfig extends AxiosRequestConfig {
    silentError?: boolean;
}

export interface ApiOptions {
    throwOnlyCustomError?: boolean;
    applyTranslation?: boolean;
}

export class ApiService {

    private httpService: AxiosInstance;
    private configService: ConfigService;

    private options: ApiOptions = {
    };

    constructor(configService: ConfigService, loadingService: LoadingService, authService: AuthService, errorService: ErrorService, options?: ApiOptions) {
        this.configService = configService;
        authService.apiService = this;
        this.options = { ...this.options, ...options };
        this.httpService = Axios.create();

        this.httpService.interceptors.request.use((config) => {
            loadingService.loadingStart(config);
            config.withCredentials = config.withCredentials === undefined ? true : config.withCredentials;

            let headers = authService.getHeaders();
            if (headers) {
                config.headers = { ...config.headers, ...headers };
            }
            if (config.withCredentials && authService && authService.store.isAuthenticated) {
                let authHeaders = authService.getAuthHeaders();
                if (authHeaders) {
                    config.auth = undefined;
                    config.headers = { ...config.headers, ...authHeaders };
                }
            }
            return config;
        });

        this.httpService.interceptors.response.use((response) => {
            if (response && response.config) {
                loadingService.loadingEnd(response.config);
            }
            return response;
        }, (error) => {
            if (error) {
                let userError: BdsError = { underlyingError: error };
                loadingService.loadingEnd(error.config);
                let customError = false;
                if (error.response && error.response.data && error.response.data.errorCode) {
                    customError = true;
                    userError = { ...userError, ...error.response.data };
                } else {
                    if (error.response) {
                        userError.errorCode = error.response.status || "";
                        userError.errorMessage = error.response.statusText || "";
                        userError.developerMessage = error.response.data || "";
                    }
                }
                if (customError || this.options.throwOnlyCustomError !== true) {
                    if (!error.config || !error.config.silentError) {
                        errorService.error('apiService', userError);
                    }
                }
                return Promise.reject(userError);
            }
            return Promise.reject(error);
        });
    }

    public get headers(): any {
        return this.httpService.defaults.headers;
    }

    public async getDeviceId(): Promise<string | undefined> {
        let deviceId = localStorage.getItem("DeviceId");
        if (!deviceId) {
            let options = {};
            let fingerPrint = await Fingerprint2.getPromise(options);
            let values = fingerPrint.map(c => c.value);
            deviceId = Fingerprint2.x64hash128(values.join(''), 31);
            localStorage.setItem("DeviceId", deviceId);
        }
        return deviceId;
    }

    public setDefaultLocale(lang: string) {
        this.httpService.defaults.headers.common['Accept-Language'] = lang;
    }

    public async init() {
        this.httpService.defaults.baseURL = this.configService.configuration?.serverUrl;
        this.httpService.defaults.headers.common['AppId'] = this.configService.configuration?.appId;
        this.httpService.defaults.headers.common['DeviceId'] = await this.getDeviceId();
        if (this.options.applyTranslation) this.httpService.defaults.headers.common['Translation'] = true;
    }

    public post(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<any>> {
        return this.httpService.post(url, data, config);
    }

    public get(url: string, config?: ApiRequestConfig): Promise<AxiosResponse<any>> {
        return this.httpService.get(url, config);
    }

    public put(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<any>> {
        return this.httpService.put(url, data, config);
    }

    public patch(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<any>> {
        return this.httpService.patch(url, data, config);
    }

    public delete(url: string, config?: ApiRequestConfig): Promise<AxiosResponse<any>> {
        return this.httpService.delete(url, config);
    }

    public downloadFile(response: AxiosResponse) {
        if (response && response.headers) {
            let filename = "";
            let disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                let matches = filenameRegex.exec(disposition);
                if (matches && matches[1]) filename = matches[1].replace(/['"]/g, '');
            }
            let type = response.headers['content-type'];

            let blob = new Blob([response.data], { type: type });
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                window.navigator.msSaveBlob(blob, filename);
            } else {
                let URL = window.URL || (window as any).webkitURL;
                let downloadUrl = URL.createObjectURL(blob);

                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    let a = document.createElement("a");
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        window.location.href = downloadUrl;
                    } else {
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                    }
                } else {
                    window.location.href = downloadUrl;
                }

                window.setTimeout(() => { URL.revokeObjectURL(downloadUrl); }, 100);
            }
        }
    }
}