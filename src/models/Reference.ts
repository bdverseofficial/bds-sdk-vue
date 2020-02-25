import { BdsObject } from './BdsObject';

export interface Reference extends BdsObject {
    id?: string;
    type?: string;
    source?: string;
    displayName?: string;
    key?: string;
}