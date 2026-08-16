import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface StyleDNA {
  archetype: string;
  name: string;
  vibe: string[];
  colors: string[];
  description: string;
}

const DUMMY_PROFILES: StyleDNA[] = [
  {
    archetype: 'The Architect',
    name: 'Urban Minimalist',
    vibe: ['Clean', 'Monochrom', 'Zeitlos'],
    colors: ['bg-black', 'bg-zinc-100', 'bg-zinc-400'],
    description: 'Du bevorzugst klare Linien und verzichtest auf laute Logos. Dein Style ist unaufgeregt, aber extrem hochwertig.'
  },
  {
    archetype: 'The Rebel',
    name: 'Y2K Streetwear',
    vibe: ['Oversized', 'Vintage', 'Bold'],
    colors: ['bg-purple-500', 'bg-black', 'bg-pink-400'],
    description: 'Du mischst Retro-Einflüsse aus den 2000ern mit modernen Baggy-Silhouetten. Auffällig und selbstbewusst.'
  },
  {
    archetype: 'The Scholar',
    name: 'Dark Academia',
    vibe: ['Preppy', 'Herbstlich', 'Intellektuell'],
    colors: ['bg-amber-900', 'bg-stone-800', 'bg-emerald-900'],
    description: 'Dein Vibe erinnert an alte Bibliotheken. Karomuster, Rollkragenpullover und schwere Stoffe prägen deinen Look.'
  }
];

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [styleProfile, setStyleProfile] = useState<StyleDNA | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);

  const startScan = async () => {
    // Erlaube Bilder und Videos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Wir benötigen Zugriff auf deine Fotos/Videos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], // Erlaube Foto und Video!
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadedMedia(result.assets[0].uri);
      processScan(result.assets[0].uri);
    }
  };

  const processScan = async (uri: string) => {
    setIsScanning(true);
    
    // Simuliere komplexe Vision-KI Analyse (Dauer: 3 Sekunden)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wähle ein zufälliges Profil als Ergebnis
    const randomProfile = DUMMY_PROFILES[Math.floor(Math.random() * DUMMY_PROFILES.length)];
    setStyleProfile(randomProfile);
    setIsScanning(false);
  };

  const resetProfile = () => {
    setStyleProfile(null);
    setUploadedMedia(null);
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header */}
        <View className="pt-16 px-4 mb-6 flex-row justify-between items-start">
          <View>
            <Text className="text-4xl font-bold text-black dark:text-white">Style-DNA</Text>
            <Text className="text-zinc-500 mt-2 text-base">Dein persönliches Fashion-Profil</Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl">
            <Text className="text-red-500 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>

        {!styleProfile && !isScanning && (
          <View className="px-4 mt-8 items-center">
            <View className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-6">
              <Text className="text-4xl">🧬</Text>
            </View>
            <Text className="text-2xl font-bold text-center text-black dark:text-white mb-4">
              Wer bist du wirklich?
            </Text>
            <Text className="text-zinc-500 text-center mb-8 px-4 leading-relaxed">
              Lade ein Foto oder ein kurzes Video von deinem Lieblingsoutfit hoch. Unsere Vision-KI analysiert Schnitte, Farben und Vibe und extrahiert deine einzigartige Style-DNA.
            </Text>

            <TouchableOpacity 
              onPress={startScan}
              className="bg-black dark:bg-white px-8 py-4 rounded-2xl w-full items-center shadow-lg flex-row justify-center space-x-2"
            >
              <Text className="text-xl">📸</Text>
              <Text className="text-white dark:text-black font-bold text-lg ml-2">Outfit scannen</Text>
            </TouchableOpacity>
          </View>
        )}

        {isScanning && (
          <View className="px-4 mt-16 items-center justify-center">
            {uploadedMedia && (
               <Image source={{ uri: uploadedMedia }} className="w-32 h-32 rounded-2xl mb-8 opacity-50" blurRadius={10} />
            )}
            <ActivityIndicator size="large" color="#208AEF" />
            <Text className="text-xl font-bold text-black dark:text-white mt-6 mb-2">Analysiere Vibe...</Text>
            <Text className="text-zinc-500 text-center">Vision-KI extrahiert Farben, Schnitte und Archetypen.</Text>
          </View>
        )}

        {styleProfile && !isScanning && (
          <View className="px-4 mt-2">
            
            {/* The Result Card */}
            <View className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-6 shadow-sm mb-6 border border-zinc-200 dark:border-zinc-700">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Dein Archetyp</Text>
                <Text className="text-xl">✨</Text>
              </View>
              
              <Text className="text-3xl font-bold text-black dark:text-white mb-1">{styleProfile.name}</Text>
              <Text className="text-blue-600 dark:text-blue-400 font-medium text-lg mb-6">{styleProfile.archetype}</Text>
              
              <Text className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                {styleProfile.description}
              </Text>

              {/* Tags */}
              <View className="flex-row flex-wrap gap-2 mb-6">
                {styleProfile.vibe.map((tag, i) => (
                  <View key={i} className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                    <Text className="text-black dark:text-white text-sm">{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Color Palette */}
              <Text className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider">Kern-Farbpalette</Text>
              <View className="flex-row gap-3">
                {styleProfile.colors.map((colorClass, i) => (
                  <View key={i} className={`w-10 h-10 rounded-full shadow-sm ${colorClass} border border-zinc-200 dark:border-zinc-700`} />
                ))}
              </View>
            </View>

            {/* 3D Avatar Teaser */}
            <View className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 items-center">
              <View className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">🧍</Text>
              </View>
              <Text className="text-lg font-bold text-black dark:text-white mb-2">Dein 3D-Avatar</Text>
              <Text className="text-zinc-500 text-center mb-4 text-sm">
                Basierend auf deiner DNA können wir einen Avatar für Virtual Try-On generieren. Gib dafür im nächsten Schritt deine Körpermaße ein.
              </Text>
              <TouchableOpacity className="bg-zinc-100 dark:bg-zinc-800 px-6 py-2 rounded-xl">
                <Text className="text-black dark:text-white font-semibold">Maße eingeben</Text>
              </TouchableOpacity>
            </View>

            {/* Retake Button */}
            <TouchableOpacity onPress={resetProfile} className="mt-8 items-center">
              <Text className="text-zinc-400 font-medium">Scan wiederholen</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </View>
  );
}
