import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmailServer } from '@/lib/email/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Send welcome email
    try {
      await sendWelcomeEmailServer(email, name)
      return NextResponse.json({ success: true })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the signup if email fails
      return NextResponse.json({ 
        success: true, 
        warning: 'Account created but welcome email could not be sent' 
      })
    }
  } catch (error) {
    console.error('Error in signup email handler:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}