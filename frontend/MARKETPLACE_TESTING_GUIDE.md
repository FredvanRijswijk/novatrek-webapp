# Marketplace Testing Guide

## Expert Application Form is Ready!

The expert application form is now available. Here's how to test it:

### 1. Access the Application Form
Navigate to: `http://localhost:3000/dashboard/become-expert`

You'll see:
- "Become an Expert" link in the sidebar under Projects
- Application form with all required fields

### 2. Test the Application Flow

**Fill out the form with:**
- Business Name: Your travel business name
- Contact Email: Your email
- Phone: Optional
- Experience: Describe your travel expertise
- Specializations: Select at least one (Adventure Travel, Luxury Travel, etc.)
- Portfolio Links: Add up to 5 portfolio URLs
- References: Optional, one per line
- Terms: Must check to submit

### 3. Application Status Page

After submitting, the page will show:
- **Pending**: Application under review
- **Approved**: Ready to set up Stripe Connect
- **Rejected**: Application not approved
- **Additional Info Required**: More information needed

### 4. Admin Review (Testing Only)

For testing, there's a temporary admin page:
`http://localhost:3000/dashboard/admin/marketplace/applications`

**Note**: Update the ADMIN_EMAILS array in the admin page with your email to access it.

From the admin page you can:
- View all applications
- Review details
- Approve/Reject applications
- Add review notes

### 5. What Happens Next

**When Approved:**
1. User sees "Application Approved" status
2. "Set Up Expert Account" button appears
3. Clicking redirects to `/dashboard/expert/onboarding`
4. This will trigger Stripe Connect onboarding (requires Stripe setup)

### 6. Database Structure

Applications are stored in Firestore:
- Collection: `marketplace_applications`
- Fields: businessName, email, experience, specializations, portfolio, etc.
- Status tracking with timestamps

### 7. Next Steps After Testing

Once you've tested the application form:
1. Set up Stripe Connect in your Stripe Dashboard
2. Add Connect webhook endpoint secret to `.env.local`
3. Implement the onboarding completion flow
4. Build the expert dashboard
5. Create product management features

### Testing Checklist

- [ ] Navigate to application form
- [ ] Fill out all required fields
- [ ] Submit application successfully
- [ ] See pending status
- [ ] Access admin page (with correct email)
- [ ] Review and approve application
- [ ] See approved status on user side
- [ ] Click "Set Up Expert Account" button

### Common Issues

1. **Can't access form**: Make sure you're logged in
2. **Can't access admin**: Update ADMIN_EMAILS in the admin page
3. **Form won't submit**: Check all required fields and terms checkbox
4. **Already applied**: Each user can only have one application

The application form is the first step in the marketplace journey. Once tested, we can move on to building the Stripe Connect integration and expert dashboard!