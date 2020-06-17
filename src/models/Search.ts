import { BdsEntity } from './BdsEntity';
import { ChangeMeTwoFactorRequest } from '@/services/profileService';
import { Group } from './Group';
import { BdsObject } from './BdsObject';
import { GeoLocation } from './User';

export interface SearchEntityRequest {
    query?: string;
    locale?: string;
    imLucky?: boolean;
    imLuckyThereShold?: number;
    explain?: boolean;
    sortField?: string;
    sortDesc?: boolean;
    limit?: number;
    scroll?: boolean;
    scrollId?: string;
    filter?: string;
    filterFacetsIfNotCategoryLeaf?: boolean;
    typeAHead?: boolean,
    forceAnd?: boolean,
    multiSelect?: boolean,
    minDate?: Date,
    maxDate?: Date,
    dateField?: Date,
    geoLocation?: GeoLocation
    geoLocationDistance?: number,
    geoLocationField?: string,
}

export interface SearchRequest {
    searchKey?: string;
    uri?: string;
}

export interface SearchItem {
    item: BdsEntity;
}

export interface SearchCount {
    count?: number;
    uri?: string;
    selected?: boolean;
}

export interface FacetValue extends BdsObject {
    name?: string;
    description?: string;
    localDescription?: string;
    localName?: string;
    multiSelect?: boolean;
    value?: string;
}

export interface Facet extends BdsEntity {
    name?: string;
    description?: string;
    localDescription?: string;
    localName?: string;
    multiSelect?: boolean;
    facetType?: string;
    values?: FacetValue[];
}

export interface SearchFacetValue extends SearchCount {
    facetValue?: FacetValue;
}

export interface SearchFacetItem extends SearchCount {
    name?: string;
    facet?: Facet;
    values?: SearchFacetValue[];
}

export interface SearchFacets extends SearchCount {
    items?: SearchFacetItem[];
}

export interface SearchGroupItem extends SearchCount {
    group?: Group;
    level?: number;
    selectedBySearch?: boolean;
}

export interface SearchGroups extends SearchCount {
    items?: SearchGroupItem[];
}

export interface SearchTypeItem extends SearchCount {
    type?: string;
}

export interface SearchTypes extends SearchCount {
    items?: SearchTypeItem[];
}

export interface SearchParameters {
    sortField?: string;
    sortDesc?: boolean;
}

export interface SearchEntityResponse {
    items: SearchItem[];
    scrollId?: string;
    query?: SearchRequest;
    totalCount?: number,
    page?: number,
    limit?: number,
    parameters?: SearchParameters;
    facets?: SearchFacets;
    groups?: SearchGroups;
    types?: SearchTypes;
}