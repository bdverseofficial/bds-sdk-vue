export class LoadingService {

    public loadingStart(config: unknown): void { }

    public loadingEnd(config: unknown): void { }

    public async usingLoading(context: unknown, promise: () => Promise<void>): Promise<void> {
        this.loadingStart(context);
        try {
            await promise();
        } finally {
            this.loadingEnd(context);
        }
    }
}