import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase/admin'
import { 
  sendExpertApplicationReceivedEmailServer,
  sendExpertApplicationApprovedEmailServer,
  sendExpertApplicationRejectedEmailServer,
  sendExpertApplicationNeedsInfoEmailServer
} from '@/lib/email/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { action, applicationId, reason, infoNeeded } = body

    if (!action || !applicationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get application details
    const applicationDoc = await adminDb
      .collection('marketplace_applications')
      .doc(applicationId)
      .get()
    
    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    const application = {
      id: applicationDoc.id,
      ...applicationDoc.data()
    } as any

    // For application received email, verify the user is the applicant
    if (action === 'received' && application.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For status update emails, verify the user is an admin
    if (['approved', 'rejected', 'needs_info'].includes(action)) {
      const userRecord = await auth.getUser(userId)
      const isAdmin = userRecord.customClaims?.admin === true
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get user details for personalization
    const userDoc = await auth.getUser(application.userId)
    const userName = userDoc.displayName || application.email.split('@')[0]

    // Send appropriate email based on action
    switch (action) {
      case 'received':
        await sendExpertApplicationReceivedEmailServer(
          application.email,
          application.businessName
        )
        break

      case 'approved':
        await sendExpertApplicationApprovedEmailServer(
          application.email,
          userName,
          application.businessName
        )
        break

      case 'rejected':
        await sendExpertApplicationRejectedEmailServer(
          application.email,
          userName,
          application.businessName,
          reason || application.reviewNotes
        )
        break

      case 'needs_info':
        await sendExpertApplicationNeedsInfoEmailServer(
          application.email,
          userName,
          application.businessName,
          infoNeeded || application.reviewNotes || 'Please check your application for required information.'
        )
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending expert application email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}