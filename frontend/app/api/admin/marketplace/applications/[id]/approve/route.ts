import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { 
  sendExpertApplicationApprovedEmailServer,
  sendExpertApplicationRejectedEmailServer,
  sendExpertApplicationNeedsInfoEmailServer
} from '@/lib/email/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Verify admin status
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, reason, infoNeeded } = await request.json()
    const applicationId = params.id

    // Get the application
    const applicationRef = adminDb.collection('marketplace_applications').doc(applicationId)
    const applicationDoc = await applicationRef.get()
    
    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = applicationDoc.data()!
    
    // Get user details
    const userRecord = await adminAuth.getUser(application.userId)
    const userName = userRecord.displayName || application.email.split('@')[0]

    // Update application status
    const updateData: any = {
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      updatedAt: new Date()
    }

    switch (action) {
      case 'approve':
        updateData.status = 'approved'
        
        // Generate unique slug
        const baseSlug = generateSlug(application.businessName)
        const existingExperts = await adminDb.collection('marketplace_experts')
          .select('slug')
          .get()
        const existingSlugs = existingExperts.docs.map(doc => doc.data().slug).filter(Boolean)
        const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
        
        // Create expert profile
        const expertData = {
          userId: application.userId,
          businessName: application.businessName,
          slug: uniqueSlug,
          bio: application.experience || '',
          tagline: `Travel expert specializing in ${application.specializations[0]}`,
          specializations: application.specializations,
          rating: 0,
          reviewCount: 0,
          status: 'active',
          onboardingComplete: false,
          stripeConnectAccountId: '', // Will be set during onboarding
          payoutSchedule: 'monthly',
          contactEmail: application.email,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await adminDb.collection('marketplace_experts').doc(application.userId).set(expertData)
        
        // Send approval email
        await sendExpertApplicationApprovedEmailServer(
          application.email,
          userName,
          application.businessName
        )
        break

      case 'reject':
        updateData.status = 'rejected'
        updateData.reviewNotes = reason
        
        // Send rejection email
        await sendExpertApplicationRejectedEmailServer(
          application.email,
          userName,
          application.businessName,
          reason
        )
        break

      case 'needs_info':
        updateData.status = 'additional_info_required'
        updateData.reviewNotes = infoNeeded
        
        // Send needs info email
        await sendExpertApplicationNeedsInfoEmailServer(
          application.email,
          userName,
          application.businessName,
          infoNeeded
        )
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the application
    await applicationRef.update(updateData)

    return NextResponse.json({ 
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'} successfully`
    })
  } catch (error) {
    console.error('Error processing application:', error)
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    )
  }
}