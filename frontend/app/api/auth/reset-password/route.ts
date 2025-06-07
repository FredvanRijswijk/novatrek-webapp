import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmailServer } from '@/lib/email/server'
import { auth } from '@/lib/firebase/config'
import { sendPasswordResetEmail } from 'firebase/auth'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    // Send Firebase password reset email
    await sendPasswordResetEmail(auth, email)
    
    // Also send our custom branded email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login?mode=resetPassword`
    await sendPasswordResetEmailServer(email, resetUrl)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to send password reset email:', error)
    
    // Handle Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}