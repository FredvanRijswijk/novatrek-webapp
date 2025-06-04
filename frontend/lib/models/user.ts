import { 
  createUserDocument, 
  getUserDocument, 
  updateUserDocument,
  getDocument,
  updateDocument
} from '@/lib/firebase'
import { User, UserPreferences } from '@/types/travel'

export class UserModel {
  static readonly COLLECTION = 'users'

  // Create user profile
  static async create(userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await createUserDocument(userId, {
      ...userData,
      preferences: userData.preferences || this.getDefaultPreferences(),
    })
  }

  // Get user profile
  static async getById(userId: string): Promise<User | null> {
    return await getUserDocument<User>(userId)
  }

  // Update user profile
  static async update(userId: string, updates: Partial<User>): Promise<void> {
    await updateUserDocument(userId, updates)
  }

  // Update user preferences
  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const user = await this.getById(userId)
    if (!user) throw new Error('User not found')

    const updatedPreferences = { ...user.preferences, ...preferences }
    await this.update(userId, { preferences: updatedPreferences })
  }

  // Get default preferences for new users
  static getDefaultPreferences(): UserPreferences {
    return {
      travelStyle: 'mid-range',
      accommodationType: 'any',
      activityTypes: ['cultural', 'food', 'nature'],
      dietaryRestrictions: [],
      accessibility: {
        mobilityAssistance: false,
        visualImpairment: false,
        hearingImpairment: false,
        other: []
      },
      languages: ['en'],
      currency: 'USD',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  // Check if user profile is complete
  static isProfileComplete(user: User): boolean {
    return !!(
      user.displayName &&
      user.preferences &&
      user.preferences.travelStyle &&
      user.preferences.activityTypes.length > 0
    )
  }

  // Create or update user profile from Firebase Auth
  static async createOrUpdateFromAuth(authUser: {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
  }): Promise<User> {
    const existingUser = await this.getById(authUser.uid)

    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      photoURL: authUser.photoURL || undefined,
      preferences: existingUser?.preferences || this.getDefaultPreferences(),
    }

    if (existingUser) {
      // Update existing user with new auth data
      await this.update(authUser.uid, {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      })
      return { ...existingUser, ...userData }
    } else {
      // Create new user
      await this.create(authUser.uid, userData)
      return {
        id: authUser.uid,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  }
}