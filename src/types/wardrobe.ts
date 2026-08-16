export interface WardrobeItem {
  id: string;
  imageUrl: string;
  name: string;
  category: 'Top' | 'Bottom' | 'Shoes' | 'Accessory' | 'Outerwear' | 'Other';
  color: string;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All';
  createdAt: string;
}
