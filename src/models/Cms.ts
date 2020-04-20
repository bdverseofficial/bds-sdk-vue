import { BdsEntity } from './BdsEntity';
import { Reference } from './Reference';

export interface Content extends BdsEntity {
    value?: string;
    contentType?: string;
}

export type ContentType = "DEFAULT" | "HTML" | "MARKDOWN";

export interface ContentMapItem {
    content?: Reference;
    name?: string;
    contentType?: ContentType;
}

export type Source = "Local" | "Api" | "Remote";