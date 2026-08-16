import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { AvatarViewer3D } from '../components/AvatarViewer3D';
import { AIStyleRatingCard } from '../components/AIStyleRatingCard';
import { StyleDeciderModal } from '../components/StyleDeciderModal';

const MOODS = ['Alltag', 'Büro', 'Date Night', 'Sport', 'Party'];

const OUTFITS = [
  {
    top: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    bottom: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=500&q=80',
    shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80'
  },
  {
    top: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=80',
    bottom: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&w=500&q=80',
    shoes: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80'
  },
  {
    top: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
    bottom: 'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=500&q=80',
    shoes: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80'
  }
];

const WEATHER_CONDITIONS = [
  { icon: '☀️', temp: '25°C', desc: 'Sonnig' },
  { icon: '⛅️', temp: '18°C', desc: 'Bewölkt' },
  { icon: '🌧️', temp: '14°C', desc: 'Regnerisch' },
  { icon: '❄️', temp: '2°C', desc: 'Schnee' }
];

export default function StylistScreen() {
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [weatherIndex, setWeatherIndex] = useState(1);
  const [viewMode, setViewMode] = useState<'3d' | 'canvas'>('3d');
  const [showStyleDecider, setShowStyleDecider] = useState(false);

  const outfit = OUTFITS[currentOutfitIndex];
  const weather = WEATHER_CONDITIONS[weatherIndex];

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  let greeting = 'Guten Tag!';
  if (hour < 12) greeting = 'Guten Morgen!';
  else if (hour > 18) greeting = 'Guten Abend!';

  const handleShuffle = () => {
    setIsShuffling(true);
    // Simuliere die KI-Bedenkzeit
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * OUTFITS.length);
      if (nextIndex === currentOutfitIndex) {
        nextIndex = (nextIndex + 1) % OUTFITS.length;
      }
      setCurrentOutfitIndex(nextIndex);
      setWeatherIndex(Math.floor(Math.random() * WEATHER_CONDITIONS.length));
      setIsShuffling(false);
    }, 800);
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 pt-16">
      
      {/* Header & Wetter */}
      <View className="px-4 flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-3xl font-extrabold text-black dark:text-white">KI-Stylist</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">{greeting} Dein personalisierter Look.</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity 
            onPress={() => setShowStyleDecider(true)}
            className="bg-purple-600/20 border border-purple-500/40 p-2.5 rounded-2xl items-center justify-center shadow-sm"
          >
            <Text className="text-lg">🔮</Text>
          </TouchableOpacity>
          <View className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-2xl items-center shadow-sm border border-zinc-200 dark:border-zinc-700">
            <Text className="text-xl">{weather.icon}</Text>
            <Text className="text-[10px] font-bold text-black dark:text-white mt-0.5">{weather.temp}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 mb-20">
        
        {/* Anlass-Filter (Mood Selector) */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4" contentContainerStyle={{ paddingRight: 32 }}>
            {MOODS.map(mood => (
              <TouchableOpacity 
                key={mood}
                onPress={() => setActiveMood(mood)}
                className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                  activeMood === mood 
                    ? 'bg-black dark:bg-white border-black dark:border-white' 
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Text className={`font-bold text-xs ${activeMood === mood ? 'text-white dark:text-black' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* View Mode Toggle: 3D Runway vs 2D Canvas */}
        <View className="flex-row bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl mb-2 border border-zinc-200 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => setViewMode('3d')}
            className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ${viewMode === '3d' ? 'bg-blue-600' : ''}`}
          >
            <Text className="text-sm mr-1.5">🧍‍♂️</Text>
            <Text className={`text-xs font-bold ${viewMode === '3d' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
              3D Runway Model (360°)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('canvas')}
            className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ${viewMode === 'canvas' ? 'bg-black dark:bg-white' : ''}`}
          >
            <Text className="text-sm mr-1.5">🖼️</Text>
            <Text className={`text-xs font-bold ${viewMode === 'canvas' ? 'text-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>
              Flat Lay Canvas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Display: 3D Avatar OR 2D Layer Canvas */}
        {isShuffling ? (
          <View className="bg-zinc-100 dark:bg-zinc-900/60 rounded-[36px] p-12 items-center justify-center border border-zinc-200 dark:border-zinc-800 min-h-[420px] my-3">
            <Text className="text-4xl mb-4 animate-bounce">✨</Text>
            <Text className="text-black dark:text-white font-bold text-lg">KI kalkuliert perfekte Passform...</Text>
            <Text className="text-zinc-500 text-xs mt-1 text-center">Analysiere Silhouette, Schnittproportionen & Wetterdaten ({weather.temp})</Text>
          </View>
        ) : (
          viewMode === '3d' ? (
            <AvatarViewer3D outfit={outfit} activeMood={activeMood} />
          ) : (
            <View className="bg-zinc-50 dark:bg-zinc-900 rounded-[36px] p-6 items-center justify-center border border-zinc-200 dark:border-zinc-800 relative overflow-hidden min-h-[420px] my-3">
              {/* Oberteil */}
              <View className="w-44 h-44 bg-white dark:bg-zinc-800 rounded-3xl shadow-md p-2 z-20 rotate-[-2deg]">
                <Image source={{ uri: outfit.top }} className="w-full h-full rounded-2xl" resizeMode="cover" />
              </View>
              
              {/* Hose */}
              <View className="w-44 h-52 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm p-2 z-10 rotate-[3deg] -mt-10">
                <Image source={{ uri: outfit.bottom }} className="w-full h-full rounded-2xl" resizeMode="cover" />
              </View>

              {/* Schuhe */}
              <View className="w-36 h-28 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-2 z-30 -mt-8">
                <Image source={{ uri: outfit.shoes }} className="w-full h-full rounded-xl" resizeMode="cover" />
              </View>
            </View>
          )
        )}

        {/* 2. KI-Style Rating & Fit Evaluation Component */}
        <AIStyleRatingCard mood={activeMood} weatherTemp={weather.temp} />

        <View className="h-16" />
      </ScrollView>

      {/* Floating Shuffle Button */}
      <View className="absolute bottom-5 w-full px-6">
        <TouchableOpacity 
          onPress={handleShuffle}
          disabled={isShuffling}
          className="bg-blue-600 dark:bg-blue-500 w-full py-4 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/40 flex-row"
        >
          <Text className="text-white font-extrabold text-base">✨ Neues Outfit & Silhouette würfeln</Text>
        </TouchableOpacity>
      </View>

      {/* Style Decider Modal */}
      <StyleDeciderModal
        visible={showStyleDecider}
        onClose={() => setShowStyleDecider(false)}
      />

    </View>
  );
}
