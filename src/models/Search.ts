import { BdsEntity } from './BdsEntity';

export interface SearchRequest {
    searchKey?: string;
    query?: string;
    imLucky?: boolean;
    explain?: boolean;
    sortField?: string;
    sortDesc?: boolean;
    limit?: number;
    scroll?: boolean;
    scrollId?: string;
    filter?: string;
    filterFacetsIfNotCategoryLeaf?: boolean;
}

export interface SearchItem {
    item: BdsEntity;
}

export interface SearchParameters {
    sortField?: string;
    sortDesc?: boolean;
}

export interface SearchEntityResponse {
    items: SearchItem[];
    scrollId?: string;
    query?: SearchRequest;
    parameters?: SearchParameters;
}