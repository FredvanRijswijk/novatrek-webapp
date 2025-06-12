/**
 * Packing List Model V2 - Packing lists subcollection model
 */

import { BaseModelV2 } from './base-model';
import { PackingListV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { where, orderBy } from 'firebase/firestore';

export class PackingListModelV2 extends BaseModelV2<PackingListV2> {
  constructor() {
    super((ids: string[]) => COLLECTIONS_V2.PACKING_LISTS(ids[0])); // ids[0] is tripId
  }

  /**
   * Create a new packing list
   */
  async createPackingList(
    tripId: string,
    listData: Omit<PackingListV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId'>
  ): Promise<PackingListV2> {
    const enhancedData = {
      ...listData,
      tripId,
      items: listData.items || [],
      completedItems: listData.completedItems || [],
      stats: {
        totalItems: listData.items?.length || 0,
        completedItems: 0,
        categories: this.calculateCategoryStats(listData.items || [])
      }
    };
    
    return this.create(enhancedData, [tripId]);
  }

  /**
   * Get all packing lists for a trip
   */
  async getTripPackingLists(tripId: string): Promise<PackingListV2[]> {
    return this.list(
      [tripId],
      undefined,
      orderBy('createdAt', 'desc')
    );
  }

  /**
   * Get the primary packing list for a trip
   */
  async getPrimaryPackingList(tripId: string): Promise<PackingListV2 | null> {
    const lists = await this.list(
      [tripId],
      [where('isPrimary', '==', true)]
    );
    
    return lists[0] || null;
  }

  /**
   * Update packing list items
   */
  async updateItems(
    tripId: string,
    listId: string,
    items: PackingListV2['items']
  ): Promise<void> {
    const stats = {
      totalItems: items.length,
      categories: this.calculateCategoryStats(items)
    };
    
    await this.update(listId, {
      items,
      stats: {
        ...stats,
        completedItems: 0 // Reset completed count when items change
      }
    }, [tripId]);
  }

  /**
   * Toggle item completion
   */
  async toggleItemCompletion(
    tripId: string,
    listId: string,
    itemId: string
  ): Promise<void> {
    const list = await this.getById(listId, [tripId]);
    if (!list) throw new Error('Packing list not found');
    
    const completedItems = list.completedItems || [];
    const isCompleted = completedItems.includes(itemId);
    
    const updatedCompletedItems = isCompleted
      ? completedItems.filter(id => id !== itemId)
      : [...completedItems, itemId];
    
    await this.update(listId, {
      completedItems: updatedCompletedItems,
      stats: {
        ...list.stats,
        completedItems: updatedCompletedItems.length
      }
    }, [tripId]);
  }

  /**
   * Generate packing list from template
   */
  async generateFromTemplate(
    tripId: string,
    template: 'beach' | 'mountain' | 'city' | 'business' | 'adventure',
    tripDuration: number,
    travelers: number,
    weatherData?: any
  ): Promise<PackingListV2> {
    const items = this.getTemplateItems(template, tripDuration, travelers, weatherData);
    
    return this.createPackingList(tripId, {
      name: `${template.charAt(0).toUpperCase() + template.slice(1)} Trip Packing List`,
      description: `Generated packing list for ${tripDuration} days`,
      isPrimary: true,
      items,
      template,
      completedItems: []
    });
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(items: PackingListV2['items']): Record<string, number> {
    const stats: Record<string, number> = {};
    
    items.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Get template items based on trip type
   */
  private getTemplateItems(
    template: string,
    duration: number,
    travelers: number,
    weatherData?: any
  ): PackingListV2['items'] {
    const baseItems: PackingListV2['items'] = [
      // Essentials (always included)
      { id: 'passport', name: 'Passport/ID', category: 'Documents', quantity: travelers, essential: true },
      { id: 'wallet', name: 'Wallet', category: 'Documents', quantity: travelers, essential: true },
      { id: 'phone-charger', name: 'Phone Charger', category: 'Electronics', quantity: travelers, essential: true },
      { id: 'medications', name: 'Medications', category: 'Health', quantity: 1, essential: true },
      { id: 'toiletries', name: 'Toiletries', category: 'Personal Care', quantity: travelers },
      { id: 'underwear', name: 'Underwear', category: 'Clothing', quantity: Math.max(duration + 1, 7) * travelers },
      { id: 'socks', name: 'Socks', category: 'Clothing', quantity: Math.max(duration + 1, 7) * travelers },
    ];

    // Template-specific items
    const templateItems: Record<string, PackingListV2['items']> = {
      beach: [
        { id: 'swimsuit', name: 'Swimsuit', category: 'Clothing', quantity: 2 * travelers },
        { id: 'sunscreen', name: 'Sunscreen', category: 'Personal Care', quantity: 1, essential: true },
        { id: 'beach-towel', name: 'Beach Towel', category: 'Beach', quantity: travelers },
        { id: 'sunglasses', name: 'Sunglasses', category: 'Accessories', quantity: travelers },
        { id: 'flip-flops', name: 'Flip Flops', category: 'Footwear', quantity: travelers },
        { id: 'beach-bag', name: 'Beach Bag', category: 'Bags', quantity: 1 },
        { id: 'snorkel-gear', name: 'Snorkel Gear', category: 'Activities', quantity: travelers, optional: true },
      ],
      mountain: [
        { id: 'hiking-boots', name: 'Hiking Boots', category: 'Footwear', quantity: travelers, essential: true },
        { id: 'backpack', name: 'Day Backpack', category: 'Bags', quantity: travelers },
        { id: 'water-bottle', name: 'Water Bottle', category: 'Gear', quantity: travelers, essential: true },
        { id: 'rain-jacket', name: 'Rain Jacket', category: 'Clothing', quantity: travelers },
        { id: 'layers', name: 'Warm Layers', category: 'Clothing', quantity: 3 * travelers },
        { id: 'hat-gloves', name: 'Hat & Gloves', category: 'Accessories', quantity: travelers },
        { id: 'first-aid', name: 'First Aid Kit', category: 'Health', quantity: 1, essential: true },
      ],
      city: [
        { id: 'walking-shoes', name: 'Comfortable Walking Shoes', category: 'Footwear', quantity: travelers },
        { id: 'day-bag', name: 'Day Bag/Purse', category: 'Bags', quantity: travelers },
        { id: 'dressy-outfit', name: 'Dressy Outfit', category: 'Clothing', quantity: 1 * travelers },
        { id: 'umbrella', name: 'Compact Umbrella', category: 'Accessories', quantity: 1 },
        { id: 'guidebook', name: 'Guidebook/Maps', category: 'Documents', quantity: 1, optional: true },
        { id: 'camera', name: 'Camera', category: 'Electronics', quantity: 1, optional: true },
      ],
      business: [
        { id: 'business-attire', name: 'Business Attire', category: 'Clothing', quantity: Math.ceil(duration * 0.8) * travelers },
        { id: 'dress-shoes', name: 'Dress Shoes', category: 'Footwear', quantity: travelers },
        { id: 'laptop', name: 'Laptop & Charger', category: 'Electronics', quantity: travelers, essential: true },
        { id: 'business-cards', name: 'Business Cards', category: 'Documents', quantity: 1 },
        { id: 'notebook', name: 'Notebook & Pens', category: 'Office', quantity: travelers },
        { id: 'briefcase', name: 'Briefcase/Work Bag', category: 'Bags', quantity: travelers },
      ],
      adventure: [
        { id: 'multi-tool', name: 'Multi-tool', category: 'Gear', quantity: 1 },
        { id: 'headlamp', name: 'Headlamp', category: 'Gear', quantity: travelers, essential: true },
        { id: 'quick-dry-clothes', name: 'Quick-dry Clothes', category: 'Clothing', quantity: Math.ceil(duration * 0.5) * travelers },
        { id: 'water-purification', name: 'Water Purification', category: 'Gear', quantity: 1, optional: true },
        { id: 'emergency-whistle', name: 'Emergency Whistle', category: 'Safety', quantity: travelers },
        { id: 'insect-repellent', name: 'Insect Repellent', category: 'Health', quantity: 1, essential: true },
      ],
    };

    // Weather-based additions
    const weatherItems: PackingListV2['items'] = [];
    if (weatherData) {
      // Add weather-specific items based on conditions
      if (weatherData.temperature < 10) {
        weatherItems.push(
          { id: 'winter-coat', name: 'Winter Coat', category: 'Clothing', quantity: travelers, essential: true },
          { id: 'thermal-underwear', name: 'Thermal Underwear', category: 'Clothing', quantity: 2 * travelers }
        );
      }
      if (weatherData.precipitation > 50) {
        weatherItems.push(
          { id: 'rain-gear', name: 'Rain Gear', category: 'Clothing', quantity: travelers, essential: true }
        );
      }
    }

    return [
      ...baseItems,
      ...(templateItems[template] || []),
      ...weatherItems,
    ];
  }
}