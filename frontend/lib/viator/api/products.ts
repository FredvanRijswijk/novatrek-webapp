/**
 * Viator Products API
 */

import { getViatorApiClient } from './client';
import { 
  Product, 
  ProductSummary, 
  ProductSearchParams, 
  ProductSearchResponse 
} from '../types/product';
import { ViatorApiResponse } from '../types/common';

export class ViatorProductsApi {
  private client = getViatorApiClient();
  
  /**
   * Search for products
   */
  async search(params: ProductSearchParams): Promise<ProductSearchResponse> {
    const response = await this.client.post<{
      products: ProductSummary[];
      totalCount: number;
    }>('/products/search', {
      destId: params.destId,
      searchQuery: params.searchQuery,
      startDate: params.startDate,
      endDate: params.endDate,
      sorting: params.sorting,
      filtering: params.filtering,
      pagination: params.pagination,
      currency: params.currency || 'USD',
    });
    
    return {
      products: response.products || [],
      totalCount: response.totalCount || 0,
      pagination: {
        ...params.pagination,
        hasMore: (params.pagination.offset + params.pagination.limit) < (response.totalCount || 0),
      },
    };
  }
  
  /**
   * Get product details by code
   */
  async getProduct(productCode: string, currency: string = 'USD'): Promise<Product> {
    const response = await this.client.get<Product>(
      `/products/${productCode}`,
      { currency }
    );
    
    return response;
  }
  
  /**
   * Get multiple products by codes
   */
  async getBulkProducts(
    productCodes: string[], 
    currency: string = 'USD'
  ): Promise<Product[]> {
    if (productCodes.length === 0) {
      return [];
    }
    
    const response = await this.client.post<ViatorApiResponse<Product[]>>(
      '/products/bulk',
      {
        productCodes,
        currency,
      }
    );
    
    return response.data || [];
  }
  
  /**
   * Get product recommendations
   */
  async getRecommendations(
    productCode: string,
    params?: {
      count?: number;
      currency?: string;
    }
  ): Promise<ProductSummary[]> {
    const response = await this.client.post<{
      products: ProductSummary[];
    }>('/products/recommendations', {
      productCode,
      count: params?.count || 10,
      currency: params?.currency || 'USD',
    });
    
    return response.products || [];
  }
  
  /**
   * Get products modified since a given date
   */
  async getModifiedSince(
    modifiedSince: string,
    params?: {
      count?: number;
      cursor?: string;
    }
  ): Promise<{
    products: Product[];
    nextCursor?: string;
    lastModifiedDate?: string;
  }> {
    const response = await this.client.get<ViatorApiResponse<Product[]>>(
      '/products/modified-since',
      {
        modifiedSince,
        count: params?.count || 100,
        cursor: params?.cursor,
      }
    );
    
    return {
      products: response.data || [],
      nextCursor: response.nextCursor,
      lastModifiedDate: response.lastModifiedDate,
    };
  }
}

// Singleton instance
let productsApi: ViatorProductsApi | null = null;

export function getViatorProductsApi(): ViatorProductsApi {
  if (!productsApi) {
    productsApi = new ViatorProductsApi();
  }
  return productsApi;
}