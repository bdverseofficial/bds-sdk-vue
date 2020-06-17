import { Cart, Order, ProductOffersResponse, Review, B2CCustomer } from '../models/Cs';
import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { SearchEntityResponse, SearchRequest, SearchEntityRequest } from '../models/Search';

export interface CsOptions {
    priceBookKey?: string;
}

export interface CsStore {
    cart?: Cart;
}

export class CsService {

    private options: CsOptions = {
    };

    private apiService: ApiService;
    private configService: ConfigService;

    public store: CsStore = {
    };

    constructor(configService: ConfigService, apiService: ApiService, options?: CsOptions) {
        this.apiService = apiService;
        this.configService = configService;
        this.options = { ...this.options, ...options };
    }

    public async init(): Promise<void> {
        if (this.configService.configuration) {
            let configCs = this.configService.configuration.cs;
            if (configCs) {
                this.options = { ...this.options, ...configCs };
            }
        }
    }

    public async initUser(): Promise<void> {
        await this.refreshCart();
    }

    public async refreshCart(): Promise<void> {
        this.store.cart = (await this.getCartApi()) || undefined;
    }

    public async register(customer: B2CCustomer, password: string, options?: ApiRequestConfig): Promise<B2CCustomer | null> {
        let request = {
            customer: customer,
            password: password
        };
        let response = await this.apiService.post('api/cs/v1/b2c/registerCustomer', request, options);
        if (response) return response.data;
        return null;
    }

    public async removeLineFromCart(lineNumber: string): Promise<void> {
        this.store.cart = (await this.removeLineFromCartApi(lineNumber)) || undefined;
    }

    public async addLineToCart(productOffersKey: string, quantity: number, offerId?: string): Promise<void> {
        this.store.cart = (await this.addLineToCartApi(productOffersKey, quantity, offerId)) || undefined;
    }

    public async updateLineFromCart(lineNumber: string, newQuantity: number): Promise<void> {
        this.store.cart = (await this.updateLineFromCartApi(lineNumber, newQuantity)) || undefined;
    }

    public async createOrder(paymentData: string): Promise<Order | null> {
        let order = await this.createOrderApi(paymentData);
        await this.refreshCart();
        return order;
    }

    public async getProductOffers(productOffersKey: string): Promise<ProductOffersResponse | null> {
        return await this.getProductOffersApi(productOffersKey);
    }

    public async getProductOffersReviews(productOffersKey: string, limit: number, scrollId?: string): Promise<Review[] | null> {
        return await this.getProductOffersReviewsApi(productOffersKey, limit, scrollId);
    }

    public async searchCatalog(request: SearchEntityRequest): Promise<SearchEntityResponse | null> {
        let options = {
            headers: {
                Filters: [
                    "Facet:name|localName",
                    "FacetValue:name|localName",
                    "PIM.Category:name|localName",
                    "PIM.CategoryType:name|localName",
                    "CRM.Price:displayName",
                    "CRM.ProductOffer:unitPriceWithTax|isSalePromotion",
                    "CRM.Product:name|localName|description|localDescription|assets|brand|id",
                    "CRM.ProductOffers:fullProduct|currentOffer|reviewScore|reviewNumber|isInStock|isSalePromotion|canBeSold|isPopular|isNew|isPopular|isChoice|key"
                ].join(",")
            }
        };
        return await this.searchCatalogApi(request, options);
    }

    public async getMainNavigation(request: SearchRequest): Promise<SearchEntityResponse | null> {
        return await this.getMainNavigationApi(request);
    }

    public async getOrders(limit: number, scrollId?: string): Promise<Order[] | null> {
        return await this.getOrdersApi(limit, scrollId);
    }

    public async getOrder(orderKey: string): Promise<Order | null> {
        return await this.getOrderApi(orderKey);
    }

    private async getMainNavigationApi(request: SearchRequest, options?: ApiRequestConfig): Promise<SearchEntityResponse | null> {
        if (request) {
            if (this.options.priceBookKey) {
                let response = await this.apiService.post(
                    "api/cs/v1/b2c/" +
                    this.options.priceBookKey +
                    "/navigation",
                    request,
                    options
                );
                return response.data;
            }
        }
        return null;
    }

    private async searchCatalogApi(request: any, options?: ApiRequestConfig): Promise<SearchEntityResponse | null> {
        if (request) {
            if (this.options.priceBookKey) {
                let response = await this.apiService.post(
                    "api/cs/v1/b2c/" +
                    this.options.priceBookKey +
                    "/search",
                    request,
                    options
                );
                return response.data;
            }
        }
        return null;
    }

    private async getProductOffersReviewsApi(productOffersKey: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Review[] | null> {
        if (productOffersKey) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/product/" + productOffersKey + "/reviews",
                { ...options, params: { limit: limit, scrollId: scrollId } }
            );
            return response.data;
        }
        return null;
    }

    private async getProductOffersApi(productOffersKey: string, options?: ApiRequestConfig): Promise<ProductOffersResponse | null> {
        if (productOffersKey) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/product/" + productOffersKey,
                options
            );
            return response.data;
        }
        return null;
    }

    private async getCartApi(options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.options.priceBookKey) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/" + this.options.priceBookKey + "/cart",
                options
            );
            return response.data;
        }
        return null;
    }

    private async addLineToCartApi(productOffersKey: string, quantity: number, offerId?: string, options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.store.cart) {
            let request = {
                productOffersKey: productOffersKey,
                quantity: quantity,
                offerId: offerId,
            };
            let response = await this.apiService.put(
                "api/cs/v1/b2c/" + this.store.cart.key + "/cart/",
                request,
                options
            );
            return response.data;
        }
        return null;
    }

    private async updateLineFromCartApi(lineNumber: string, quantity: number, options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.store.cart) {
            let request = {
                quantity: quantity
            };
            let response = await this.apiService.post(
                "api/cs/v1/b2c/" + this.store.cart.key + "/cart/" + lineNumber,
                request,
                options
            );
            return response.data;
        }
        return null;
    }

    private async createOrderApi(paymentData: string, options?: ApiRequestConfig): Promise<Order | null> {
        if (this.store.cart) {
            let request = {
                paymentData: paymentData
            };
            let response = await this.apiService.put(
                "api/cs/v1/b2c/" + this.store.cart.key + "/order",
                request,
                options
            );
            return response.data;
        }
        return null;
    }

    private async removeLineFromCartApi(lineNumber: string, options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.store.cart) {
            let response = await this.apiService.delete(
                "api/cs/v1/b2c/" + this.store.cart.key + "/cart/" + lineNumber,
                options
            );
            return response.data;
        }
        return null;
    }

    private async getOrdersApi(limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Order[] | null> {
        if (this.options.priceBookKey) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/" + this.options.priceBookKey + "/orders",
                { ...options, params: { limit: limit, scrollId: scrollId } }
            );
            return response.data;
        }
        return null;
    }

    private async getOrderApi(orderKey: string, options?: ApiRequestConfig): Promise<Order | null> {
        let response = await this.apiService.get(
            "api/cs/v1/b2c/" + orderKey + "/order",
            options
        );
        return response.data;
    }
}