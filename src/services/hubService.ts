import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { AuthService } from './authService';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

export interface HubOptions {
    connectionCompleted?: (connection: HubConnection) => Promise<void>;
}

export interface HubStore {
}

export class HubService {

    private options: HubOptions = {
    };

    private apiService: ApiService;
    private authService: AuthService;
    private configService: ConfigService;
    private connection?: HubConnection;
    private entities: string[] = [];

    public store: HubStore = {
    };

    constructor(apiService: ApiService, authService: AuthService, configService: ConfigService, options?: HubOptions) {
        this.apiService = apiService;
        this.authService = authService;
        this.configService = configService;
        this.options = { ...this.options, ...options };
    }

    public async init(): Promise<void> {
    }

    private async startConnection(): Promise<HubConnection> {
        if (!this.connection) {
            let deviceId = await this.apiService.getDeviceId();
            this.connection = new HubConnectionBuilder().withUrl(this.configService.configuration!.serverUrl! + "hubs/bds?appId=" + this.configService.configuration?.appId + "&deviceId=" + deviceId, { accessTokenFactory: () => this.authService.getAccessToken()! }).build();
            this.connection.onclose(() => this.internalStartConnection());
            await this.internalStartConnection();
        }
        return this.connection;
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            let c = this.connection;
            this.connection = undefined;
            await c.stop();
        }
    }

    private async internalStartConnection(): Promise<void> {
        if (this.connection && this.connection.state !== HubConnectionState.Connected) {
            await this.connection.start().then(() => this.connectToEntities()).catch(() => {
                return new Promise((resolve, reject) => window.setTimeout(() => this.internalStartConnection().then(resolve).catch(reject), 5000));
            });
        }
    }

    private async connectToEntities(): Promise<void> {
        if (this.entities && this.connection) {
            this.entities.forEach(async entityKey => {
                await this.connection?.send("Connect", entityKey);
            });
            if (this.options.connectionCompleted) {
                await this.options.connectionCompleted(this.connection);
            }
        }
    }

    public async connect(entityKey: string): Promise<void> {
        if (this.entities.indexOf(entityKey) === -1) {
            this.entities.push(entityKey);
            if (this.connection) {
                await this.connection.send("Connect", entityKey);
            }
            if (!this.connection && this.entities.length > 0) {
                await this.startConnection();
            }
        }
    }

    public async disconnect(entityKey: string): Promise<void> {
        if (this.entities.indexOf(entityKey) !== -1) {
            this.entities = this.entities.filter(e => e != entityKey);
            if (this.connection) {
                await this.connection.send("Disconnect", entityKey);
            }
            if (!this.connection && this.entities.length == 0) {
                await this.stopConnection();
            }
        }
    }

    public async sendMessage(entityKey: string, methodName: string, parameters: unknown): Promise<void> {
        if (this.connection) {
            await this.connection.send("Message", entityKey, methodName, parameters);
        }
    }
}