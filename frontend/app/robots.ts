import { MetadataRoute } from 'next'
import { config } from '@/lib/config/environment'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = config.appUrl
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/login-admin',
          '/debug-admin/',
          '/fix-admin/',
          '/test-admin-simple/',
          '/verify-admin/',
          '/create-admin-doc/',
          '/s/', // Shared trip links
          '/shared/', // Shared trip pages
          '/extension-auth/',
          '/test*', // All test pages
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}