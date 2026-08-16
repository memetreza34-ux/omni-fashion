export interface SwapItem {
  id: string;
  title: string;
  brand: string;
  category: 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories';
  size: string;
  condition: 'Like New' | 'Excellent' | 'Good' | 'Upcycled';
  estimatedValue: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  imageUrl: string;
  ownerName: string;
  ownerAvatar: string;
  ownerLocation: string;
  aestheticTag: string;
  description: string;
}

export interface SwapTradeProposal {
  id: string;
  offeredItemId: string;
  requestedItemId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface UserSwapProfileStats {
  totalSwaps: number;
  totalCo2SavedKg: number;
  totalWaterSavedLiters: number;
  reputationScore: number;
}

export interface EcoImpactMetrics {
  totalCommunitySwaps: number;
  totalCo2SavedKg: number;
  totalWaterSavedLiters: number;
  treesEquivalentSaved: number;
}
