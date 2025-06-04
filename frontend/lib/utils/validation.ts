/**
 * Validation utilities for form inputs
 */

export const validationRules = {
  // Trip validation
  trip: {
    title: {
      required: 'Trip title is required',
      minLength: { value: 3, message: 'Title must be at least 3 characters' },
      maxLength: { value: 100, message: 'Title must be less than 100 characters' }
    },
    destination: {
      required: 'Please select a destination'
    },
    dates: {
      required: 'Please select travel dates',
      validate: {
        futureDate: (value: Date) => {
          if (value < new Date()) {
            return 'Start date must be in the future';
          }
          return true;
        },
        validRange: (endDate: Date, formValues: any) => {
          if (endDate <= formValues.startDate) {
            return 'End date must be after start date';
          }
          return true;
        }
      }
    },
    travelers: {
      required: 'At least one traveler is required',
      validate: {
        hasName: (travelers: any[]) => {
          const hasEmptyName = travelers.some(t => !t.name || t.name.trim() === '');
          if (hasEmptyName) {
            return 'All travelers must have a name';
          }
          return true;
        }
      }
    },
    budget: {
      min: { value: 0, message: 'Budget must be a positive number' },
      max: { value: 1000000, message: 'Budget seems unrealistic' },
      validate: {
        validRange: (max: number, formValues: any) => {
          if (formValues.budgetRange?.min && max < formValues.budgetRange.min) {
            return 'Maximum budget must be greater than minimum';
          }
          return true;
        }
      }
    }
  },

  // Activity validation
  activity: {
    name: {
      required: 'Activity name is required',
      minLength: { value: 2, message: 'Name must be at least 2 characters' }
    },
    duration: {
      min: { value: 15, message: 'Duration must be at least 15 minutes' },
      max: { value: 1440, message: 'Duration cannot exceed 24 hours' }
    },
    cost: {
      min: { value: 0, message: 'Cost cannot be negative' }
    }
  },

  // General validation
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },

  phone: {
    pattern: {
      value: /^[\d\s\-\+\(\)]+$/,
      message: 'Invalid phone number'
    }
  }
};

/**
 * Validate a single field
 */
export function validateField(value: any, rules: any): string | null {
  if (rules.required && !value) {
    return typeof rules.required === 'string' ? rules.required : 'This field is required';
  }

  if (rules.minLength && value && value.length < rules.minLength.value) {
    return rules.minLength.message;
  }

  if (rules.maxLength && value && value.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }

  if (rules.min && value < rules.min.value) {
    return rules.min.message;
  }

  if (rules.max && value > rules.max.value) {
    return rules.max.message;
  }

  if (rules.pattern && value && !rules.pattern.value.test(value)) {
    return rules.pattern.message;
  }

  if (rules.validate) {
    for (const validator of Object.values(rules.validate)) {
      const result = (validator as Function)(value);
      if (result !== true) {
        return result as string;
      }
    }
  }

  return null;
}

/**
 * Date validation helpers
 */
export const dateValidation = {
  isFutureDate: (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  isValidDateRange: (startDate: Date, endDate: Date): boolean => {
    return endDate > startDate;
  },

  maxTripDuration: (startDate: Date, endDate: Date, maxDays: number = 365): boolean => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= maxDays;
  }
};

/**
 * Budget validation helpers
 */
export const budgetValidation = {
  isReasonable: (amount: number, travelers: number): boolean => {
    const perPersonAmount = amount / travelers;
    // Reasonable daily budget per person (adjust as needed)
    return perPersonAmount >= 10 && perPersonAmount <= 10000;
  },

  hasValidBreakdown: (breakdown: any): boolean => {
    const total = Object.values(breakdown).reduce((sum: number, value: any) => sum + value, 0);
    // Check if breakdown roughly equals total (allow small rounding differences)
    return Math.abs(total - 100) < 5;
  }
};