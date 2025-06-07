import { PackingTemplate, PackingCategory } from '@/types/travel'

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Standard categories
const CATEGORIES = {
  ESSENTIALS: 'Essentials',
  CLOTHES: 'Clothes', 
  TOILETRIES: 'Toiletries',
  ELECTRONICS: 'Electronics',
  HEALTH: 'Health & Medications',
  DOCUMENTS: 'Documents',
  ACCESSORIES: 'Accessories',
  ENTERTAINMENT: 'Entertainment',
  OUTDOOR: 'Outdoor Gear',
  BUSINESS: 'Business Items',
  BEACH: 'Beach Essentials',
  WINTER: 'Winter Gear'
}

// Base essentials common to all trips
const baseEssentials: PackingCategory = {
  id: 'essentials',
  name: CATEGORIES.ESSENTIALS,
  icon: 'briefcase',
  order: 1,
  items: [
    { id: generateId(), name: 'Passport/ID', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Wallet', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Phone charger', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Keys', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Cash/Cards', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Travel insurance info', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Medication', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Sunglasses', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Reusable water bottle', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Snacks', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Hand sanitizer', quantity: 1, checked: false, categoryId: 'essentials' },
    { id: generateId(), name: 'Face masks', quantity: 3, checked: false, categoryId: 'essentials' }
  ]
}

// Base toiletries
const baseToiletries: PackingCategory = {
  id: 'toiletries',
  name: CATEGORIES.TOILETRIES,
  icon: 'droplet',
  order: 3,
  items: [
    { id: generateId(), name: 'Toothbrush', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Toothpaste', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Shampoo', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Conditioner', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Body wash/Soap', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Deodorant', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Razor', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Sunscreen', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Moisturizer', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Towel', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Nail clippers', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'First aid kit', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Prescription medications', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Contact lenses/Glasses', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Makeup/Cosmetics', quantity: 1, checked: false, categoryId: 'toiletries' },
    { id: generateId(), name: 'Hair brush/Comb', quantity: 1, checked: false, categoryId: 'toiletries' }
  ]
}

// Base electronics
const baseElectronics: PackingCategory = {
  id: 'electronics',
  name: CATEGORIES.ELECTRONICS,
  icon: 'laptop',
  order: 4,
  items: [
    { id: generateId(), name: 'Phone', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Phone charger', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Power bank', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Universal adapter', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Headphones/Earbuds', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Camera', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Camera charger', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Memory cards', quantity: 2, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Laptop', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Laptop charger', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Tablet/E-reader', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Cables (USB, etc)', quantity: 2, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Flashlight', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Watch', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Travel router', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Extension cord', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Drone', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Action camera', quantity: 1, checked: false, categoryId: 'electronics' },
    { id: generateId(), name: 'Tripod', quantity: 1, checked: false, categoryId: 'electronics' }
  ]
}

// Weather-specific clothing functions
const getTropicalClothes = (duration: string): PackingCategory => {
  const daysMultiplier = duration === 'weekend' ? 3 : duration === 'week' ? 7 : 10
  
  return {
    id: 'clothes',
    name: CATEGORIES.CLOTHES,
    icon: 'shirt',
    order: 2,
    items: [
      { id: generateId(), name: 'T-shirts', quantity: Math.ceil(daysMultiplier * 0.8), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Shorts', quantity: Math.ceil(daysMultiplier * 0.5), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Swimwear', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Light pants', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Underwear', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Socks', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sandals/Flip-flops', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Walking shoes', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sun hat', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Light jacket', quantity: 1, checked: false, categoryId: 'clothes', weatherDependent: true },
      { id: generateId(), name: 'Dress/Nice outfit', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sleepwear', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Beach cover-up', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sunglasses', quantity: 1, checked: false, categoryId: 'clothes' }
    ]
  }
}

const getTemperateClothes = (duration: string): PackingCategory => {
  const daysMultiplier = duration === 'weekend' ? 3 : duration === 'week' ? 7 : 10
  
  return {
    id: 'clothes',
    name: CATEGORIES.CLOTHES,
    icon: 'shirt',
    order: 2,
    items: [
      { id: generateId(), name: 'T-shirts', quantity: Math.ceil(daysMultiplier * 0.6), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Long sleeve shirts', quantity: Math.ceil(daysMultiplier * 0.4), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Jeans/Pants', quantity: Math.ceil(daysMultiplier * 0.4), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Shorts', quantity: 2, checked: false, categoryId: 'clothes', weatherDependent: true },
      { id: generateId(), name: 'Sweater', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Light jacket', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Rain jacket', quantity: 1, checked: false, categoryId: 'clothes', weatherDependent: true },
      { id: generateId(), name: 'Underwear', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Socks', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Walking shoes', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Casual shoes', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Dress outfit', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sleepwear', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Belt', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Scarf', quantity: 1, checked: false, categoryId: 'clothes', weatherDependent: true }
    ]
  }
}

const getColdClothes = (duration: string): PackingCategory => {
  const daysMultiplier = duration === 'weekend' ? 3 : duration === 'week' ? 7 : 10
  
  return {
    id: 'clothes',
    name: CATEGORIES.CLOTHES,
    icon: 'shirt',
    order: 2,
    items: [
      { id: generateId(), name: 'Thermal underwear', quantity: Math.ceil(daysMultiplier * 0.5), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Long sleeve shirts', quantity: Math.ceil(daysMultiplier * 0.6), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sweaters', quantity: 3, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Heavy jacket', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Jeans/Warm pants', quantity: Math.ceil(daysMultiplier * 0.4), checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Underwear', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Warm socks', quantity: daysMultiplier, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Winter boots', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Indoor shoes', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Winter hat', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Gloves', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Scarf', quantity: 1, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Sleepwear', quantity: 2, checked: false, categoryId: 'clothes' },
      { id: generateId(), name: 'Hand warmers', quantity: 4, checked: false, categoryId: 'clothes', weatherDependent: true },
      { id: generateId(), name: 'Thermal leggings', quantity: 2, checked: false, categoryId: 'clothes' }
    ]
  }
}

// Trip type specific items
const businessItems: PackingCategory = {
  id: 'business',
  name: CATEGORIES.BUSINESS,
  icon: 'briefcase',
  order: 5,
  items: [
    { id: generateId(), name: 'Business cards', quantity: 50, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Portfolio/Documents', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Business attire', quantity: 3, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Dress shoes', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Laptop', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Notebook', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Pens', quantity: 3, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Presentation remote', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Portable projector', quantity: 1, checked: false, categoryId: 'business' },
    { id: generateId(), name: 'Business casual outfit', quantity: 2, checked: false, categoryId: 'business' }
  ]
}

const adventureItems: PackingCategory = {
  id: 'outdoor',
  name: CATEGORIES.OUTDOOR,
  icon: 'mountain',
  order: 5,
  items: [
    { id: generateId(), name: 'Hiking boots', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Backpack', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Water filter', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Camping gear', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Headlamp', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Multi-tool', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'First aid kit', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Map/Compass', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Emergency whistle', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Rope', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Insect repellent', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Quick-dry towel', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Energy bars', quantity: 10, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Sleeping bag', quantity: 1, checked: false, categoryId: 'outdoor' },
    { id: generateId(), name: 'Tent', quantity: 1, checked: false, categoryId: 'outdoor' }
  ]
}

const beachItems: PackingCategory = {
  id: 'beach',
  name: CATEGORIES.BEACH,
  icon: 'sun',
  order: 5,
  items: [
    { id: generateId(), name: 'Beach towel', quantity: 2, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Beach bag', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Snorkel gear', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Beach umbrella', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Waterproof phone case', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Beach games', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Cooler', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Aloe vera', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Beach chair', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Goggles', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Water shoes', quantity: 1, checked: false, categoryId: 'beach' },
    { id: generateId(), name: 'Floating device', quantity: 1, checked: false, categoryId: 'beach' }
  ]
}

// Packing templates
export const packingTemplates: PackingTemplate[] = [
  // Business trips
  {
    id: 'business-temperate-week',
    name: 'Business Trip - Week',
    description: 'Professional travel essentials for a week-long business trip',
    tripType: 'business',
    climate: 'temperate',
    duration: 'week',
    categories: [
      baseEssentials,
      getTemperateClothes('week'),
      baseToiletries,
      baseElectronics,
      businessItems
    ],
    isDefault: true,
    createdAt: new Date()
  },
  
  // Beach vacation
  {
    id: 'beach-tropical-week',
    name: 'Beach Vacation - Week',
    description: 'Everything you need for a relaxing beach getaway',
    tripType: 'beach',
    climate: 'tropical',
    duration: 'week',
    categories: [
      baseEssentials,
      getTropicalClothes('week'),
      baseToiletries,
      baseElectronics,
      beachItems
    ],
    isDefault: true,
    createdAt: new Date()
  },
  
  // Adventure trip
  {
    id: 'adventure-temperate-week',
    name: 'Adventure Trip - Week',
    description: 'Gear and essentials for outdoor adventures',
    tripType: 'adventure',
    climate: 'temperate',
    duration: 'week',
    categories: [
      baseEssentials,
      getTemperateClothes('week'),
      baseToiletries,
      baseElectronics,
      adventureItems
    ],
    isDefault: true,
    createdAt: new Date()
  },
  
  // City exploration
  {
    id: 'city-temperate-weekend',
    name: 'City Weekend',
    description: 'Essentials for a weekend city break',
    tripType: 'city',
    climate: 'temperate',
    duration: 'weekend',
    categories: [
      baseEssentials,
      getTemperateClothes('weekend'),
      baseToiletries,
      baseElectronics
    ],
    isDefault: true,
    createdAt: new Date()
  },
  
  // Winter vacation
  {
    id: 'leisure-cold-week',
    name: 'Winter Vacation - Week',
    description: 'Stay warm and comfortable on your winter getaway',
    tripType: 'leisure',
    climate: 'cold',
    duration: 'week',
    categories: [
      baseEssentials,
      getColdClothes('week'),
      baseToiletries,
      baseElectronics
    ],
    isDefault: true,
    createdAt: new Date()
  }
]

// Helper function to find the best matching template
export function findBestTemplate(
  tripType: 'leisure' | 'business' | 'adventure' | 'beach' | 'city' | 'mixed',
  climate: 'tropical' | 'temperate' | 'cold' | 'desert' | 'mixed',
  duration: number // in days
): PackingTemplate | null {
  const durationCategory = duration <= 3 ? 'weekend' : duration <= 7 ? 'week' : 'extended'
  
  // First try exact match
  let template = packingTemplates.find(
    t => t.tripType === tripType && t.climate === climate && t.duration === durationCategory
  )
  
  // If no exact match, try matching trip type with any climate
  if (!template) {
    template = packingTemplates.find(
      t => t.tripType === tripType && t.duration === durationCategory
    )
  }
  
  // If still no match, try matching climate with any trip type
  if (!template) {
    template = packingTemplates.find(
      t => t.climate === climate && t.duration === durationCategory
    )
  }
  
  // If still no match, return the most generic template
  if (!template) {
    template = packingTemplates.find(t => t.tripType === 'leisure' && t.climate === 'temperate')
  }
  
  return template || null
}

// Function to merge template with custom items
export function mergeWithCustomItems(
  template: PackingTemplate,
  customItems: PackingItem[]
): PackingCategory[] {
  const categories = [...template.categories]
  
  // Add custom items to appropriate categories or create new ones
  customItems.forEach(item => {
    const categoryIndex = categories.findIndex(c => c.id === item.categoryId)
    if (categoryIndex >= 0) {
      categories[categoryIndex].items.push(item)
    } else {
      // Create new category if it doesn't exist
      const newCategory: PackingCategory = {
        id: item.categoryId,
        name: 'Custom Items',
        order: categories.length + 1,
        items: [item]
      }
      categories.push(newCategory)
    }
  })
  
  return categories
}