import { BdsEntity } from './BdsEntity';
import { Reference } from './Reference';

export interface Content extends BdsEntity {
    value?: string;
    contentType?: string;
    order?: string;
}

export type ContentType = "DEFAULT" | "HTML" | "MARKDOWN";

export interface ContentMapItem {
    content?: Reference;
    name?: string;
    contentType?: ContentType;
    order?: number;
}

export type Source = "Local" | "Api" | "Remote";