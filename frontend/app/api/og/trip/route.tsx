import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get trip details from query params
    const tripName = searchParams.get('name') || 'Amazing Trip'
    const destinations = searchParams.get('destinations')?.split(',') || ['Paris', 'Rome', 'Barcelona']
    const duration = searchParams.get('duration') || '7 days'
    const travelerName = searchParams.get('traveler') || 'A NovaTrek Traveler'
    
    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '40px 60px',
            }}
          >
            {/* Logo Circle - matches your actual logo */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
              }}
            >
              {/* Inner circle (creates the ring effect) */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#000000',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '32px',
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              NovaTrek
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 60px',
            }}
          >
            {/* Trip Name */}
            <div
              style={{
                display: 'flex',
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '32px',
                lineHeight: '1.1',
              }}
            >
              {tripName}
            </div>

            {/* Destinations */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '32px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {destinations.slice(0, 3).map((dest, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      padding: '12px 28px',
                      background: 'transparent',
                      borderRadius: '50px',
                      fontSize: '24px',
                      color: '#FFFFFF',
                      border: '2px solid #FFFFFF',
                    }}
                  >
                    {dest}
                  </div>
                  {index < destinations.length - 1 && index < 2 && (
                    <div style={{ display: 'flex', color: '#666666', fontSize: '24px' }}>→</div>
                  )}
                </div>
              ))}
              {destinations.length > 3 && (
                <div style={{ display: 'flex', color: '#999999', fontSize: '20px' }}>
                  +{destinations.length - 3} more
                </div>
              )}
            </div>

            {/* Duration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #666666',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#999999',
                }}
              >
                ⏱
              </div>
              <div style={{ display: 'flex', fontSize: '20px', color: '#999999' }}>{duration}</div>
            </div>

            {/* Shared By */}
            <div
              style={{
                display: 'flex',
                fontSize: '18px',
                color: '#CCCCCC',
                marginBottom: '48px',
              }}
            >
              Shared by {travelerName}
            </div>

            {/* CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 36px',
                background: 'transparent',
                border: '2px solid #FFFFFF',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex' }}>View Trip Details</div>
              <div style={{ display: 'flex', fontSize: '16px' }}>→</div>
            </div>
          </div>
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