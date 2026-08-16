import type { SwapItem, SwapTradeProposal, UserSwapProfileStats, EcoImpactMetrics } from '../types/swap.ts';

export const mockSwapItems: SwapItem[] = [
  {
    id: 'item-1',
    title: 'Tabi Ankle Boots',
    brand: 'Maison Margiela',
    category: 'Shoes',
    size: 'EU 41',
    condition: 'Like New',
    estimatedValue: 850,
    co2SavedKg: 18.5,
    waterSavedLiters: 4200,
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Sora Takahashi',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'Tokyo / Shibuya',
    aestheticTag: 'Avant-Garde',
    description: 'Iconic split-toe leather ankle boots in immaculate condition. Worn twice for editorial shoot.'
  },
  {
    id: 'item-2',
    title: 'Oversized Vintage Denim Jacket',
    brand: 'Acne Studios',
    category: 'Outerwear',
    size: 'M',
    condition: 'Excellent',
    estimatedValue: 420,
    co2SavedKg: 14.2,
    waterSavedLiters: 3800,
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'Berlin / Mitte',
    aestheticTag: 'Streetwear',
    description: 'Heavyweight organic denim jacket with signature distressing and custom hardware.'
  },
  {
    id: 'item-3',
    title: 'Le Chiquito Leather Mini Bag',
    brand: 'Jacquemus',
    category: 'Accessories',
    size: 'One Size',
    condition: 'Like New',
    estimatedValue: 550,
    co2SavedKg: 8.0,
    waterSavedLiters: 1900,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Camille Laurent',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'Paris / Le Marais',
    aestheticTag: 'Parisian Chic',
    description: 'Structured mini top handle bag in smooth beige calfskin with gold metal plaque.'
  },
  {
    id: 'item-4',
    title: 'Pleats Please Tapered Trousers',
    brand: 'Issey Miyake',
    category: 'Bottoms',
    size: 'S',
    condition: 'Excellent',
    estimatedValue: 380,
    co2SavedKg: 9.5,
    waterSavedLiters: 2400,
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Maya Lin',
    ownerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'London / Soho',
    aestheticTag: 'Minimalist',
    description: 'Signature technical heat-pleated pants in deep navy. Wrinkle-resistant and incredibly fluid.'
  },
  {
    id: 'item-5',
    title: 'Re-Nylon Oversized Bomber',
    brand: 'Prada',
    category: 'Outerwear',
    size: 'L',
    condition: 'Upcycled',
    estimatedValue: 1200,
    co2SavedKg: 26.0,
    waterSavedLiters: 6500,
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Lucas Vance',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'New York / Soho',
    aestheticTag: 'Luxury Techwear',
    description: 'Upcycled ocean-plastic nylon bomber jacket with enamelled triangle logo and utility pockets.'
  },
  {
    id: 'item-6',
    title: 'Darkshadow High-Top Sneakers',
    brand: 'Rick Owens',
    category: 'Shoes',
    size: 'EU 42',
    condition: 'Good',
    estimatedValue: 490,
    co2SavedKg: 16.0,
    waterSavedLiters: 3600,
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Zane Thorne',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'Milan / Brera',
    aestheticTag: 'Darkwear',
    description: 'Canvas high-top trainers with contrast bumper caps and elongated tongue. Authentic patina.'
  },
  {
    id: 'item-7',
    title: 'Crescent Moon Print Top',
    brand: 'Marine Serre',
    category: 'Tops',
    size: 'S',
    condition: 'Like New',
    estimatedValue: 290,
    co2SavedKg: 6.8,
    waterSavedLiters: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=800&q=80',
    ownerName: 'Aria Thorne',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    ownerLocation: 'Copenhagen / Vesterbro',
    aestheticTag: 'Modern Future',
    description: 'Second-skin jersey top featuring all-over iconic crescent moon motif in tan and black.'
  }
];

export const mockTradeProposals: SwapTradeProposal[] = [
  {
    id: 'tp-1',
    offeredItemId: 'item-2',
    requestedItemId: 'item-1',
    status: 'pending',
    createdAt: '2026-08-06T14:30:00Z'
  },
  {
    id: 'tp-2',
    offeredItemId: 'item-4',
    requestedItemId: 'item-3',
    status: 'accepted',
    createdAt: '2026-08-05T09:15:00Z'
  },
  {
    id: 'tp-3',
    offeredItemId: 'item-7',
    requestedItemId: 'item-4',
    status: 'pending',
    createdAt: '2026-08-07T11:00:00Z'
  }
];

export const mockUserProfileStats: UserSwapProfileStats = {
  totalSwaps: 14,
  totalCo2SavedKg: 184.5,
  totalWaterSavedLiters: 42100,
  reputationScore: 4.95
};

export const mockEcoImpactMetrics: EcoImpactMetrics = {
  totalCommunitySwaps: 1284,
  totalCo2SavedKg: 18420,
  totalWaterSavedLiters: 4195000,
  treesEquivalentSaved: 875
};
