import { Reference } from "./Reference";
import { BdsObject } from './BdsObject';

export interface UserEvent extends BdsObject {
    on?: Date;
    by?: Reference;
}