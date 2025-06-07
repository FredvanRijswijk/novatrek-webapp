# NovaTrek Admin Account Setup Guide

## Overview

NovaTrek now uses a proper role-based access control (RBAC) system for admin accounts instead of hardcoded email addresses. This guide explains how to create and manage admin accounts.

## Admin Roles

### 1. **Super Admin** (`super_admin`)
- Full access to all system features
- Can manage other admins
- Access to all marketplace functions
- Can modify system settings

### 2. **Marketplace Admin** (`marketplace_admin`)
- Manage marketplace operations
- Review and approve expert applications
- Moderate products
- View transactions (read-only)
- Cannot create other admins

### 3. **Support Admin** (`support_admin`)
- Read-only access to all areas
- Useful for customer support staff
- Can view but not modify data
- Cannot perform any write operations

## Creating Admin Accounts

### Prerequisites

1. **Firebase Admin SDK**: Ensure you have the Firebase Admin SDK credentials file:
   ```
   frontend/novatrek-dev-firebase-adminsdk.json
   ```

2. **Environment Variables**: Your `.env.local` should have Firebase configuration

3. **Install Dependencies**: 
   ```bash
   npm install
   ```

### Using the Admin Creation Script

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Run the create-admin script**:
   ```bash
   npm run create-admin -- --email admin@example.com --name "John Doe" --role super_admin
   ```

   **Parameters**:
   - `--email` (required): Admin's email address
   - `--name` (required): Admin's full name
   - `--role` (required): One of: `super_admin`, `marketplace_admin`, `support_admin`
   - `--password` (optional): Set a specific password (otherwise auto-generated)

3. **Examples**:
   ```bash
   # Create a super admin with auto-generated password
   npm run create-admin -- --email john@novatrek.com --name "John Smith" --role super_admin

   # Create a marketplace admin with specific password
   npm run create-admin -- --email sarah@novatrek.com --name "Sarah Johnson" --role marketplace_admin --password "SecurePass123!"

   # Create a support admin
   npm run create-admin -- --email support@novatrek.com --name "Support Team" --role support_admin
   ```

### What Happens When You Create an Admin

1. **Firebase Auth User**: Creates or updates a Firebase Authentication user
2. **Admin Record**: Creates a record in the `admin_users` Firestore collection
3. **Permissions**: Assigns role-based permissions automatically
4. **Custom Claims**: Sets Firebase custom claims for enhanced security

## Admin Data Structure

Admin records in Firestore (`admin_users` collection):

```typescript
{
  id: string              // User ID (same as Firebase Auth UID)
  userId: string          // Firebase Auth UID
  email: string           // Admin email
  name: string            // Admin full name
  role: AdminRole         // super_admin | marketplace_admin | support_admin
  permissions: [{         // Array of permissions
    resource: string      // Resource name
    actions: string[]     // Allowed actions
  }]
  isActive: boolean       // Account active status
  lastLogin?: Date        // Last login timestamp
  createdAt: Date         // Account creation date
  updatedAt: Date         // Last update date
  createdBy?: string      // ID of admin who created this account
}
```

## Permissions by Role

### Super Admin Permissions
- **marketplace**: read, create, update, delete
- **users**: read, create, update, delete
- **experts**: read, create, update, delete
- **products**: read, create, update, delete
- **transactions**: read, create, update, delete
- **applications**: read, create, update, delete
- **settings**: read, create, update, delete

### Marketplace Admin Permissions
- **marketplace**: read, update
- **experts**: read, update
- **products**: read, update, delete
- **transactions**: read
- **applications**: read, update

### Support Admin Permissions
- **marketplace**: read
- **users**: read
- **experts**: read
- **products**: read
- **transactions**: read
- **applications**: read

## Accessing Admin Features

1. **Login**: Admin users log in through the regular login flow
2. **Admin Section**: The admin section appears in the sidebar (shield icon)
3. **Route Protection**: Admin routes are protected by the `AdminRoute` component
4. **Permission Checks**: Specific actions check for required permissions

## Managing Admin Accounts

### Deactivating an Admin

To deactivate an admin account, update the `isActive` field in Firestore:

```javascript
// In Firebase Console or via Admin SDK
db.collection('admin_users').doc(userId).update({
  isActive: false,
  updatedAt: new Date()
})
```

### Changing Admin Roles

Run the create-admin script again with the same email but different role:

```bash
npm run create-admin -- --email admin@example.com --name "John Doe" --role marketplace_admin
```

### Viewing All Admins

Query the `admin_users` collection in Firebase Console or create an admin management interface.

## Security Best Practices

1. **Strong Passwords**: Use strong, unique passwords for admin accounts
2. **Limited Access**: Only create admin accounts when necessary
3. **Regular Audits**: Periodically review admin accounts and deactivate unused ones
4. **Role Principle**: Assign the minimum role necessary (principle of least privilege)
5. **Activity Monitoring**: Monitor admin activities through logs

## Troubleshooting

### "User already exists" Error
- This is normal if the email is already registered
- The script will update the existing user's admin status

### Permission Denied Errors
- Ensure the Firebase Admin SDK credentials are correctly configured
- Check that the service account has necessary permissions

### Admin Not Seeing Admin Section
- Verify the admin record exists in `admin_users` collection
- Check that `isActive` is set to `true`
- Ensure the user is logged in with the correct account
- Try logging out and back in

### Custom Claims Not Working
- Custom claims may take a few minutes to propagate
- Force refresh the user's ID token by logging out and back in

## Development vs Production

### Development
- Use test admin accounts
- Liberal with super_admin roles for testing
- Can manually edit Firestore for quick changes

### Production
- Strict admin account creation process
- Minimal super_admin accounts
- Audit trail for all admin actions
- Regular security reviews
- Consider implementing 2FA for admin accounts

## Future Enhancements

1. **Admin Management UI**: Build interface for managing admins
2. **Audit Logging**: Track all admin actions
3. **2FA**: Require two-factor authentication for admins
4. **Session Management**: Admin session timeouts
5. **IP Restrictions**: Limit admin access by IP address
6. **Activity Reports**: Generate admin activity reports