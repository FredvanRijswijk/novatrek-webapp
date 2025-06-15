/**
 * Viator Product Search API Route
 * Proxies requests to Viator API to keep API key secure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getViatorProductsApi } from '@/lib/viator/api/products';
import { validateViatorConfig } from '@/lib/viator/config';
import { ProductSearchParams } from '@/lib/viator/types/product';

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    if (!validateViatorConfig()) {
      return NextResponse.json(
        { error: 'Viator API not configured' },
        { status: 503 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const searchParams: ProductSearchParams = {
      destination: body.destination,
      destId: body.destId,
      searchQuery: body.searchQuery,
      startDate: body.startDate,
      endDate: body.endDate,
      sorting: body.sorting || 'TOP_SELLERS',
      filtering: body.filtering || {},
      pagination: body.pagination || { offset: 0, limit: 20 },
      currency: body.currency || 'USD',
    };
    
    // Call Viator API
    const productsApi = getViatorProductsApi();
    const response = await productsApi.search(searchParams);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Viator search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search Viator products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}