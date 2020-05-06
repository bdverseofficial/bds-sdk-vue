import { BdsEntity } from './BdsEntity';
import { Reference } from './Reference';
import { Asset } from './Asset';
import { Group } from './Group';
import { User } from './User';

export interface Dictionary<T> {
    [Key: string]: T;
}

export interface SocUser extends User {
    online?: boolean;
}

export interface MessageBase extends BdsEntity {
    content?: string;
    title?: string;
    assets?: Reference[];
    fullAssets?: Asset[];
    relatedTo?: MessageBaseGroup;

}

export interface BlogPost extends MessageBase {
    edit?: boolean;
    opened?: boolean;
}

export interface CalendarItem extends MessageBase {
    startDate?: string;
    start?: Date;
    startTimeStamp?: string;
    endDate?: string;
    end?: Date;
    endTimeStamp?: string;
    allDay?: boolean;
    edit?: boolean;
    opened?: boolean;
}

export interface MessageBaseGroup extends Group {
    newMessages?: boolean;
    locked?: boolean;
}

export interface Channel extends MessageBaseGroup {

}

export interface Blog extends MessageBaseGroup {

}

export interface Calendar extends MessageBaseGroup {

}

export interface Message extends MessageBase {
    messageType?: string;
    fullAsset?: Asset;
}

export interface Topic extends Group {
    lastPost?: Post;
}

export interface Thread extends BdsEntity {
    topic?: Reference;
    title?: string;
    description?: string;
    lastPost?: Post;
}

export interface Post extends MessageBase {
    topic?: Reference;
    thread?: Reference;
    relatedTo?: Reference;
    star?: boolean;
    pinned?: boolean;
    score?: number;
    numberOfScore?: number;
    isPopular?: boolean;
    isBest?: boolean;
    flags?: string[];
}