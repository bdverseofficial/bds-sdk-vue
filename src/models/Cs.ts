import { BdsObject } from './BdsObject';
import { BdsEntity } from './BdsEntity';
import { MessageBase } from './Soc';
import { Person } from './Crm';

export interface ProductOffersResponse {
    productOffers: ProductOffers;
}

export interface Offer {
    id?: string;
}

export interface ProductAsset extends BdsObject {
    assetType?: string;
}

export interface Product extends BdsEntity {
    assets?: ProductAsset[];
    image?: ProductAsset;
}

export interface ProductOffers extends BdsEntity {
    currentOffer: Offer;
    fullProduct: Product;
    offers: Offer[];
}

export interface ProductQuantity extends BdsObject {
    value: number;
}

export interface CartLine extends BdsObject {
    lineNumber: string;
    quantity: ProductQuantity;
    productOffers: ProductOffers;
}

export interface Cart extends BdsEntity {
    lines: CartLine[];
}

export interface Order extends BdsEntity {
}

export interface Review extends MessageBase {
}

export interface B2CCustomer extends Person {

}