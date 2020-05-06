import { Cart, Order, ProductOffersResponse, Review } from '../models/Cs';
import { ApiService, ApiRequestConfig } from './apiService';
import { ConfigService } from './configService';
import { SearchEntityResponse } from '@/models/Search';

export interface CsOptions {
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
    }

    public async init() {
        this.refreshCart();
    }

    public async refreshCart() {
        this.store.cart = (await this.getCartApi()) || undefined;
    }

    public async removeLineFromCart(lineNumber: string) {
        this.store.cart = (await this.removeLineFromCartApi(lineNumber)) || undefined;
    }

    public async addLineToCart(productOffersId: string, quantity: number, offerId?: string) {
        this.store.cart = (await this.addLineToCartApi(productOffersId, quantity, offerId)) || undefined;
    }

    public async updateLineFromCart(lineNumber: string, newQuantity: number) {
        this.store.cart = (await this.updateLineFromCartApi(lineNumber, newQuantity)) || undefined;
    }

    public async createOrder(paymentData: string): Promise<Order | null> {
        let order = await this.createOrderApi(paymentData);
        await this.refreshCart();
        return order;
    }

    public async getProductOffers(productOffersId: string): Promise<ProductOffersResponse | null> {
        return await this.getProductOffersApi(productOffersId);
    }

    public async getProductOffersReviews(productOffersId: string, limit: number, scrollId?: string): Promise<Review[] | null> {
        return await this.getProductOffersReviewsApi(productOffersId, limit, scrollId);
    }

    public async searchCatalog(request: any): Promise<SearchEntityResponse | null> {
        let options = {
            headers: {
                filters: [
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

    public async getMainNavigation(request: any): Promise<SearchEntityResponse | null> {
        return await this.getMainNavigationApi(request);
    }

    public async getOrders(limit: number, scrollId?: string): Promise<Order[] | null> {
        return await this.getOrdersApi(limit, scrollId);
    }

    public async getOrder(orderId: string): Promise<Order | null> {
        return await this.getOrderApi(orderId);
    }

    private async getMainNavigationApi(request: any, options?: ApiRequestConfig): Promise<SearchEntityResponse | null> {
        if (request) {
            if (this.configService.configuration) {
                let response = await this.apiService.post(
                    "api/cs/v1/b2c/" +
                    (this.configService.configuration as any).catalogId +
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
            if (this.configService.configuration) {
                let response = await this.apiService.post(
                    "api/cs/v1/b2c/" +
                    (this.configService.configuration as any).catalogId +
                    "/search",
                    request,
                    options
                );
                return response.data;
            }
        }
        return null;
    }

    private async getProductOffersReviewsApi(productOffersId: string, limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Review[] | null> {
        if (productOffersId) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/product/" + productOffersId + "/reviews",
                { ...options, params: { limit: limit, scrollId: scrollId } }
            );
            return response.data;
        }
        return null;
    }

    private async getProductOffersApi(productOffersId: string, options?: ApiRequestConfig): Promise<ProductOffersResponse | null> {
        if (productOffersId) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/product/" + productOffersId,
                options
            );
            return response.data;
        }
        return null;
    }

    private async getCartApi(options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.configService.configuration) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/" + (this.configService.configuration as any).catalogId + "/cart",
                options
            );
            return response.data;
        }
        return null;
    }

    private async addLineToCartApi(productOffersId: string, quantity: number, offerId?: string, options?: ApiRequestConfig): Promise<Cart | null> {
        if (this.store.cart) {
            let request = {
                productOffersId: productOffersId,
                quantity: quantity,
                offerId: offerId,
            };
            let response = await this.apiService.put(
                "api/cs/v1/b2c/" + this.store.cart.id + "/cart/",
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
                "api/cs/v1/b2c/" + this.store.cart.id + "/cart/" + lineNumber,
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
                "api/cs/v1/b2c/" + this.store.cart.id + "/order",
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
                "api/cs/v1/b2c/" + this.store.cart.id + "/cart/" + lineNumber,
                options
            );
            return response.data;
        }
        return null;
    }

    private async getOrdersApi(limit: number, scrollId?: string, options?: ApiRequestConfig): Promise<Order[] | null> {
        if (this.configService.configuration) {
            let response = await this.apiService.get(
                "api/cs/v1/b2c/" + (this.configService.configuration as any).catalogId + "/orders",
                { ...options, params: { limit: limit, scrollId: scrollId } }
            );
            return response.data;
        }
        return null;
    }

    private async getOrderApi(orderId: string, options?: ApiRequestConfig): Promise<Order | null> {
        let response = await this.apiService.get(
            "api/cs/v1/b2c/" + orderId + "/order",
            options
        );
        return response.data;
    }
}