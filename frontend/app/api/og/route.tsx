import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get dynamic values from query params
    const title = searchParams.get('title') || 'AI-Powered Travel Planning'
    const description = searchParams.get('description') || 'Plan your perfect trip with personalized recommendations'
    const page = searchParams.get('page') || 'default'

    // Clean black and white theme
    const isBlackWhite = searchParams.get('theme') === 'bw'
    
    // Soft pastel theme colors
    const colorSchemes: Record<string, { bg: string; accent: string; text: string }> = {
      default: { bg: '#E8F5E9', accent: '#2E7D32', text: '#1A1A1A' },
      about: { bg: '#E3F2FD', accent: '#1976D2', text: '#1A1A1A' },
      marketplace: { bg: '#F3E5F5', accent: '#7B1FA2', text: '#1A1A1A' },
      pricing: { bg: '#FFF3E0', accent: '#F57C00', text: '#1A1A1A' },
      help: { bg: '#FFEBEE', accent: '#D32F2F', text: '#1A1A1A' },
    }

    const colors = isBlackWhite 
      ? { bg: '#000000', accent: '#FFFFFF', text: '#FFFFFF' }
      : (colorSchemes[page] || colorSchemes.default)

    return new ImageResponse(
      (
        <div
          style={{
            background: colors.bg,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Subtle gradient overlay for non-BW themes */}
          {!isBlackWhite && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
              }}
            />
          )}

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              maxWidth: '900px',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
                gap: '20px',
              }}
            >
              {/* Logo Circle - matches your actual logo */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: colors.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Inner circle (creates the ring effect) */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: colors.bg,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: colors.text,
                }}
              >
                NovaTrek
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                display: 'flex',
                fontSize: '56px',
                fontWeight: 'bold',
                color: colors.text,
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: '1.2',
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                display: 'flex',
                fontSize: '24px',
                color: isBlackWhite ? '#CCCCCC' : '#666666',
                textAlign: 'center',
                marginBottom: '48px',
                lineHeight: '1.5',
                maxWidth: '700px',
              }}
            >
              {description}
            </div>

            {/* CTA Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 36px',
                background: isBlackWhite ? 'transparent' : colors.accent,
                border: isBlackWhite ? `2px solid ${colors.accent}` : 'none',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: '600',
                color: isBlackWhite ? colors.accent : 'white',
              }}
            >
              Start Planning Your Trip
            </div>
          </div>

          {/* Bottom decoration - only for pastel themes */}
          {!isBlackWhite && (
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                display: 'flex',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `${colors.accent}20`,
                border: `2px solid ${colors.accent}40`,
              }}
            />
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}