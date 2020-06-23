import { BdsEntity } from './BdsEntity';
import { Reference } from './Reference';

export interface Licence extends BdsEntity {
    tags?: string[];
    expirationDate?: Date;
    owner?: Reference;
    licenceKey?: string;
    status?: string;
    statusMessage?: string;
}

export interface ServerLicence {
    isTrial?: boolean;
    isLimited?: boolean;
    status?: string;
}