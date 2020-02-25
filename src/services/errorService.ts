export interface BdsError {
    errorCode?: string;
    errorMessage?: string;
    developerMessage?: string;
    underlyingError?: any;
}

export interface ErrorOptions {
    errorHandler?: (context: string, error: BdsError) => Promise<void>;
}

export class ErrorService {

    private options: ErrorOptions = {
        errorHandler: (context: string, error: BdsError) => { alert(context + " : " + error.errorCode + " : " + error.developerMessage); return Promise.resolve(); },
    };

    constructor(options?: ErrorOptions) {
        if (options) {
            this.options.errorHandler = options.errorHandler || this.options.errorHandler;
        }
    }

    public error(context: string, error: BdsError): Promise<void> {
        if (this.options.errorHandler) return this.options.errorHandler(context, error);
        return Promise.resolve();
    }
}