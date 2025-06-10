# Open Graph Images Guide

This guide explains how NovaTrek uses Vercel's OG Image Generation for dynamic social sharing images.

## Implementation

We use Vercel's `@vercel/og` package to dynamically generate OG images. This approach provides:
- Dynamic content based on page/trip details
- Consistent branding across all pages
- No need to maintain static image files
- Automatic optimization

## API Routes

### 1. Default OG Image (`/api/og`)
- Used for all static pages
- Query parameters:
  - `title`: Main heading text
  - `description`: Subtitle text
  - `page`: Page identifier for color scheme (default, about, marketplace, pricing, help)

Example:
```
/api/og?title=About%20NovaTrek&description=Our%20mission%20to%20revolutionize%20travel&page=about
```

### 2. Trip OG Image (`/api/og/trip`)
- Used for shared trip links
- Query parameters:
  - `name`: Trip name
  - `destinations`: Comma-separated list of destinations
  - `duration`: Trip duration
  - `traveler`: Name of person sharing

Example:
```
/api/og/trip?name=European%20Adventure&destinations=Paris,Rome,Barcelona&duration=14%20days&traveler=John%20Doe
```

## Design Guidelines

1. **Consistency**: All images should follow the same design language
2. **Text Hierarchy**: Main text should be readable at small sizes
3. **Brand Colors**: 
   - Primary: #3B82F6 (Blue)
   - Background: #0F172A (Dark)
   - Accent: #1E293B (Lighter dark)
4. **Typography**: Use clean, modern sans-serif fonts
5. **Imagery**: Use high-quality travel-related imagery or illustrations

## Implementation Notes

- Currently using a placeholder SVG (`og-image-placeholder.svg`)
- Replace with actual JPG images before production launch
- Consider using Next.js Image Generation API for dynamic OG images
- Test with social media debuggers:
  - Facebook: https://developers.facebook.com/tools/debug/
  - Twitter: https://cards-dev.twitter.com/validator
  - LinkedIn: https://www.linkedin.com/post-inspector/

## Future Enhancements

1. **Dynamic OG Images for Experts**: Generate custom OG images for each expert profile
2. **Trip Sharing Images**: Custom images for shared trip links
3. **Seasonal Variations**: Update images based on seasons or campaigns
4. **A/B Testing**: Test different OG images for conversion optimization