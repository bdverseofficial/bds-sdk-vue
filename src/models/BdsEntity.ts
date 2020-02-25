import { BdsObject } from './BdsObject';
import { UserEvent, Reference } from '..';

export interface BdsMeta {
    cas?: string;
    created?: UserEvent;
    modified?: UserEvent;
    disabled?: boolean;
    owner?: Reference;
}

export interface BdsEntity extends BdsObject {
    id?: string;
    key?: string;
    meta?: BdsMeta;
}