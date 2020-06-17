import { BdsEntity } from './BdsEntity';
import { Reference } from './Reference';
import { BdsObject } from './BdsObject';
import { Asset } from './Asset';

export interface Country extends BdsEntity {
    name: string;
    isoCode3: string;
    phoneExtension: number;
    phoneExtensionName: string;
}

export interface Phone extends BdsObject {
    countryPhoneExt?: string;
    number?: string;
}

export interface TwoFactorAuthentication extends BdsObject {
    activated?: boolean;
    method?: string;
}

export interface GeoLocation {
    lat?: number;
    alt?: number;
    lon?: number;
}

export interface Address extends BdsObject {
    attention?: string;
    geoLocation?: GeoLocation;
    street?: string;
    city?: string;
    postalCode?: string;
    state?: string;
    stateCode?: string;
    country?: Reference;
}

export interface ClientApplicationUserRole {
    application?: Reference;
    role?: string;
}

export interface User extends BdsEntity {
    name?: string;
    login?: string;
    salutation?: string;
    suffix?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    activated?: boolean;
    password?: string;
    changePasswordRequired?: boolean;
    twoFactorAuthentication?: TwoFactorAuthentication;
    culture?: Reference;
    address?: Address;
    phone?: Phone;
    clientApplicationUserRoles?: ClientApplicationUserRole[];
    identityProvider?: string;
    avatar?: Reference;
    fullAvatar?: Asset;
}