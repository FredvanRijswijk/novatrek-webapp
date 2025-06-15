/**
 * Viator API Base Client
 */

import { viatorConfig } from '../config';
import { ViatorApiResponse, ViatorError } from '../types/common';

export class ViatorApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ViatorApiError';
  }
}

export class ViatorApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor() {
    this.baseUrl = viatorConfig.apiUrl;
    this.headers = { ...viatorConfig.headers };
  }
  
  /**
   * Make an API request
   */
  async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.headers,
        ...options.headers,
        'Content-Type': 'application/json',
      },
    };
    
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url.toString(), requestOptions);
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ViatorApiError(
          errorData?.code || 'API_ERROR',
          errorData?.message || `API request failed with status ${response.status}`,
          errorData?.details
        );
      }
      
      // Parse response
      const data = await response.json();
      return data;
      
    } catch (error) {
      // Re-throw ViatorApiError
      if (error instanceof ViatorApiError) {
        throw error;
      }
      
      // Wrap other errors
      throw new ViatorApiError(
        'NETWORK_ERROR',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }
  
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', endpoint, { params });
  }
  
  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>('POST', endpoint, { body, params });
  }
  
  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>('PUT', endpoint, { body, params });
  }
  
  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('DELETE', endpoint, { params });
  }
}

// Singleton instance
let apiClient: ViatorApiClient | null = null;

export function getViatorApiClient(): ViatorApiClient {
  if (!apiClient) {
    apiClient = new ViatorApiClient();
  }
  return apiClient;
}