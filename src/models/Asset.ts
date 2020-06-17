import { BdsEntity } from './BdsEntity';

export interface Asset extends BdsEntity {
    fileName?: string;
    loading?: boolean;
    mimeType?: string;
    uri?: string;
    dataUrl?: string;
    data?: string;
    preview?: any;
}