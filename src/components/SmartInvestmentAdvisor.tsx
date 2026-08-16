import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';

interface InvestmentPiece {
  id: string;
  name: string;
  category: string;
  price: string;
  unlockOutfits: number;
  matchScore: number;
  reason: string;
  image: string;
  store: string;
  swapAvailable: boolean;
}

const RECOMMENDATIONS: InvestmentPiece[] = [
  {
    id: '1',
    name: 'Oversized Vintage Lederjacke',
    category: 'Outerwear',
    price: '79,00 €',
    unlockOutfits: 14,
    matchScore: 97,
    reason: 'Schließt die Übergangs-Lücke. Passt zu all deinen T-Shirts und verleiht deinen schlichten Hosen sofort einen kantigen High-Fashion Look.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
    store: 'Zalando / Vintage',
    swapAvailable: true
  },
  {
    id: '2',
    name: 'Pleated Wide-Leg Chino (Sand)',
    category: 'Bottom',
    price: '49,99 €',
    unlockOutfits: 11,
    matchScore: 93,
    reason: 'Deine Hosen sind aktuell sehr denim-lastig. Diese Chino öffnet den Weg für sommerliche Smart-Casual & Office-Kombinationen.',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80',
    store: 'ASOS Design',
    swapAvailable: false
  },
  {
    id: '3',
    name: 'Minimalist Chunky Loafers',
    category: 'Shoes',
    price: '89,90 €',
    unlockOutfits: 9,
    matchScore: 89,
    reason: 'Ersetzt Sneaker bei schickeren Anlässen (Date Night, Business), ohne an Bequemlichkeit oder Style-Faktor einzubüßen.',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
    store: 'H&M Premium',
    swapAvailable: true
  }
];

export function SmartInvestmentAdvisor() {
  const [selectedPiece, setSelectedPiece] = useState<InvestmentPiece>(RECOMMENDATIONS[0]);

  const handleSwapOffer = (piece: InvestmentPiece) => {
    Alert.alert(
      'OmniSwap Suchauftrag',
      `Wir haben einen Radar für "${piece.name}" in deiner Region aktiviert! Du wirst benachrichtigt, sobald ein User es zum Tausch anbietet.`,
      [{ text: 'Super!' }]
    );
  };

  const handleBuy = (piece: InvestmentPiece) => {
    Alert.alert(
      'Partner-Shop öffnen',
      `Weiterleitung zu ${piece.store} für "${piece.name}" (${piece.price}).`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-2xl mb-8">
      
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-2.5 border border-blue-500/30">
            <Text className="text-base">🎯</Text>
          </View>
          <View>
            <Text className="text-white font-bold text-lg">Next Best Buy</Text>
            <Text className="text-zinc-400 text-xs">Gezielte Schrank-Erweiterung</Text>
          </View>
        </View>
        <View className="bg-blue-600/20 border border-blue-500/40 px-3 py-1 rounded-full">
          <Text className="text-blue-400 font-extrabold text-xs">KI-Berechnet</Text>
        </View>
      </View>

      <Text className="text-zinc-300 text-sm leading-relaxed mb-5">
        Statt blind zu shoppen: Diese Teile maximieren deine Outfit-Möglichkeiten mit deinen bestehenden Sachen.
      </Text>

      {/* Horizontale Auswahl der 3 Empfehlungen */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-2 px-2">
        {RECOMMENDATIONS.map((piece) => {
          const isSelected = selectedPiece.id === piece.id;
          return (
            <TouchableOpacity
              key={piece.id}
              onPress={() => setSelectedPiece(piece)}
              className={`mr-3 w-36 rounded-2xl p-2.5 border transition-all ${
                isSelected 
                  ? 'bg-zinc-800 border-blue-500 shadow-lg' 
                  : 'bg-zinc-950/80 border-zinc-800'
              }`}
            >
              <View className="w-full h-28 rounded-xl overflow-hidden mb-2 bg-zinc-800">
                <Image source={{ uri: piece.image }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute top-1.5 right-1.5 bg-blue-600 px-1.5 py-0.5 rounded-md">
                  <Text className="text-white text-[10px] font-black">+{piece.unlockOutfits}</Text>
                </View>
              </View>
              <Text className="text-white font-bold text-xs" numberOfLines={1}>{piece.name}</Text>
              <Text className="text-blue-400 text-[11px] font-semibold mt-0.5">+{piece.unlockOutfits} neue Looks</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Detaillierte Fokus-Karte des ausgewählten Teils */}
      <View className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-emerald-400 font-bold text-xs mr-2">
              ⚡️ {selectedPiece.matchScore}% Style-Match
            </Text>
            {selectedPiece.swapAvailable && (
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <Text className="text-emerald-300 text-[10px] font-bold">In OmniSwap verfügbar</Text>
              </View>
            )}
          </View>
          <Text className="text-white font-black text-sm">{selectedPiece.price}</Text>
        </View>

        <Text className="text-white font-bold text-base mb-1.5">{selectedPiece.name}</Text>
        
        <View className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 mb-4">
          <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">💡 Warum sich dieses Teil lohnt:</Text>
          <Text className="text-zinc-300 text-xs leading-relaxed">
            {selectedPiece.reason}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          {selectedPiece.swapAvailable ? (
            <TouchableOpacity
              onPress={() => handleSwapOffer(selectedPiece)}
              className="flex-1 bg-emerald-600 py-3 rounded-xl items-center justify-center flex-row shadow-lg shadow-emerald-600/30"
            >
              <Text className="text-white font-bold text-xs mr-1">🔄 Auf OmniSwap tauschen</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSwapOffer(selectedPiece)}
              className="flex-1 bg-zinc-800 py-3 rounded-xl items-center justify-center flex-row border border-zinc-700"
            >
              <Text className="text-zinc-300 font-bold text-xs mr-1">🔔 Tausch-Radar stellen</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleBuy(selectedPiece)}
            className="flex-1 bg-white py-3 rounded-xl items-center justify-center flex-row"
          >
            <Text className="text-black font-bold text-xs">🛍️ Online kaufen</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}
