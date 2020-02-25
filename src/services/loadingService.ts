export class LoadingService {

    public loadingStart(config: any) { }

    public loadingEnd(config: any) { }

    public async usingLoading(context: any, promise: () => Promise<void>) {
        this.loadingStart(context);
        try {
            await promise();
        } finally {
            this.loadingEnd(context);
        }
    }
}