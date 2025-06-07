# NovaTrek Marketplace Admin Dashboard

## Overview

The admin dashboard provides comprehensive tools for NovaTrek administrators to manage the marketplace, monitor performance, and maintain quality standards.

## Access

**Important**: Currently using email-based access control. Update the `ADMIN_EMAILS` array in admin pages with your email to test.

In production, implement proper role-based access control (RBAC).

## Admin Features

### 1. **Main Dashboard** (`/dashboard/admin/marketplace`)
- **Key Metrics**: Total revenue, platform fees, active experts, active products
- **Quick Actions**: Links to applications, experts, products, settings
- **Overview Tab**: Revenue trends and product category distribution
- **Transactions Tab**: Recent marketplace transactions with details
- **Top Experts Tab**: Performance metrics for leading experts
- **Recent Products Tab**: Newly added products requiring review

### 2. **Applications Management** (`/dashboard/admin/marketplace/applications`)
- Review expert applications
- Approve/reject/request more info
- Add review notes
- Track application history

### 3. **Expert Management** (`/dashboard/admin/marketplace/experts`)
- **Overview**: Total, active, pending, and suspended experts
- **Search & Filter**: By name, email, specialization, status
- **Actions**:
  - View detailed expert profiles
  - Activate/suspend accounts
  - View Stripe Connect details
  - Track performance metrics
- **Suspension**: Requires reason, automatically deactivates all products

### 4. **Product Moderation** (`/dashboard/admin/marketplace/products`)
- **Stats**: Active, inactive, suspended, flagged products
- **Filters**: By type, status, price, popularity
- **Actions**:
  - Review product details
  - Approve/reject/suspend products
  - Flag inappropriate content
  - Delete products (permanent)
- **Bulk Actions**: Manage multiple products efficiently

## Key Metrics Tracked

### Financial
- Total marketplace revenue
- Platform fees collected (15%)
- Monthly revenue growth
- Revenue by product type

### Operational
- Active vs. total experts
- Active vs. total products
- Transaction volume
- Average ratings

### Quality
- Flagged products
- Suspended accounts
- Pending applications
- Review ratings

## Admin Workflows

### 1. **Expert Onboarding**
1. Review application in Applications page
2. Check credentials and experience
3. Approve or request more information
4. Monitor Stripe Connect onboarding
5. Activate expert account

### 2. **Product Moderation**
1. Review new products in Products page
2. Check for quality and appropriateness
3. Approve for marketplace or flag issues
4. Monitor customer reviews and ratings

### 3. **Dispute Resolution**
1. Review flagged content
2. Investigate customer complaints
3. Suspend products/experts if needed
4. Document actions taken

## Security Considerations

1. **Access Control**: Currently email-based, needs RBAC implementation
2. **Audit Trail**: All admin actions should be logged
3. **Data Protection**: Sensitive financial data handled by Stripe
4. **Compliance**: Ensure marketplace terms are enforced

## Testing the Admin Dashboard

1. Add your email to `ADMIN_EMAILS` in:
   - `/dashboard/admin/marketplace/page.tsx`
   - `/dashboard/admin/marketplace/applications/page.tsx`
   - `/dashboard/admin/marketplace/experts/page.tsx`
   - `/dashboard/admin/marketplace/products/page.tsx`

2. Navigate to admin section in sidebar (shield icon)

3. Test workflows:
   - Review and approve an application
   - Suspend and reactivate an expert
   - Moderate products
   - View financial metrics

## Future Enhancements

1. **Advanced Analytics**
   - Revenue forecasting
   - Expert performance trends
   - Product popularity analysis
   - Customer behavior insights

2. **Automation**
   - Auto-flagging suspicious content
   - Automated quality scoring
   - Performance-based expert tiers
   - Dynamic platform fee adjustment

3. **Communication**
   - In-dashboard messaging to experts
   - Bulk email campaigns
   - Automated notifications
   - Expert newsletters

4. **Compliance**
   - Tax reporting dashboards
   - Automated 1099 generation
   - Terms of service management
   - GDPR compliance tools

The admin dashboard provides essential tools for marketplace management while maintaining a clean, intuitive interface for administrators.