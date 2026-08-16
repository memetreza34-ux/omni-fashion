import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SmartInvestmentAdvisor } from '../components/SmartInvestmentAdvisor';

export default function ShopScreen() {
  
  // Dummy Daten für Style Matches (simuliert eine echte Shop-API)
  const styleMatches = [
    { id: 1, brand: 'Zalando', name: 'Leinenhemd Beige', price: '49,99 €', image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?auto=format&fit=crop&w=300&q=80' },
    { id: 2, brand: 'ASOS', name: 'Vintage Jeans', price: '59,99 €', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=300&q=80' },
    { id: 3, brand: 'H&M', name: 'Oversize Blazer', price: '39,99 €', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80' },
  ];

  // Dummy Daten für das Deal Radar
  const deals = [
    { id: 1, shop: 'Nike', discount: '-30%', item: 'Air Force 1', oldPrice: '119 €', newPrice: '83 €', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=300&q=80' },
    { id: 2, shop: 'Zara', discount: '-20%', item: 'Lederjacke Basic', oldPrice: '89 €', newPrice: '71 €', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=300&q=80' },
  ];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-950 pt-16" showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View className="px-4 mb-5">
        <Text className="text-3xl font-extrabold text-black dark:text-white">Entdecken</Text>
        <Text className="text-zinc-500 mt-0.5">Dein KI-Personal Shopper & Style-Advisor</Text>
      </View>

      {/* 1. Next Best Buy — KI Smart Investment Advisor */}
      <View className="px-4">
        <SmartInvestmentAdvisor />
      </View>

      {/* 2. Style Matches (Horizontaler Scroll) */}
      <View className="mb-8">
        <View className="px-4 flex-row justify-between items-end mb-3">
          <View>
            <Text className="text-xl font-bold text-black dark:text-white">Style Matches 🎯</Text>
            <Text className="text-zinc-500 text-xs">Passend zu deinen Farben & Vibe</Text>
          </View>
          <TouchableOpacity><Text className="text-blue-600 dark:text-blue-400 font-semibold text-xs">Alle ansehen</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" contentContainerStyle={{ paddingRight: 32 }}>
          {styleMatches.map(match => (
            <TouchableOpacity key={match.id} className="w-40 mr-4">
              <View className="w-full h-52 bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden mb-2 border border-zinc-200 dark:border-zinc-800">
                <Image source={{ uri: match.image }} className="w-full h-full" resizeMode="cover" />
              </View>
              <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{match.brand}</Text>
              <Text className="text-black dark:text-white font-semibold text-sm" numberOfLines={1}>{match.name}</Text>
              <Text className="text-black dark:text-white font-bold text-sm mt-0.5">{match.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Deal Radar (Vertikale Liste) */}
      <View className="px-4 mb-24">
        <View className="mb-3">
          <Text className="text-xl font-bold text-black dark:text-white">Deal Radar ⚡️</Text>
          <Text className="text-zinc-500 text-xs">Günstige Angebote für deinen Kleiderschrank</Text>
        </View>
        
        {deals.map(deal => (
          <TouchableOpacity key={deal.id} className="flex-row bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-3 mb-3 items-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <View className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden mr-4 border border-zinc-200 dark:border-zinc-700">
               <Image source={{ uri: deal.image }} className="w-full h-full" resizeMode="cover" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md mr-2">{deal.discount}</Text>
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{deal.shop}</Text>
              </View>
              <Text className="text-black dark:text-white font-bold text-base mb-0.5">{deal.item}</Text>
              <View className="flex-row items-center">
                <Text className="text-zinc-400 line-through text-xs mr-2">{deal.oldPrice}</Text>
                <Text className="text-black dark:text-white font-bold text-sm">{deal.newPrice}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}
