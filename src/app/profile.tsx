import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Header, Badge, Button, Card } from '../components/ui';

interface StyleDNA {
  archetype: string;
  name: string;
  vibe: string[];
  colors: string[];
  description: string;
}

interface BodyMeasurements {
  height: string;
  chest: string;
  waist: string;
  hips: string;
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

const DNA_STORAGE_KEY = '@user_style_dna';
const MEASUREMENTS_STORAGE_KEY = '@user_body_measurements';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [styleProfile, setStyleProfile] = useState<StyleDNA | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: '182',
    chest: '98',
    waist: '82',
    hips: '96'
  });

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedDNA = await AsyncStorage.getItem(DNA_STORAGE_KEY);
      if (savedDNA) {
        setStyleProfile(JSON.parse(savedDNA));
      }
      const savedMeasurements = await AsyncStorage.getItem(MEASUREMENTS_STORAGE_KEY);
      if (savedMeasurements) {
        setMeasurements(JSON.parse(savedMeasurements));
      }
    } catch (e) {
      console.error('Error loading profile data', e);
    }
  };

  const startScan = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung fehlt', 'Wir benötigen Zugriff auf deine Fotos/Videos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
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
    
    // Simuliere 3 Sekunden Vision-KI Analyse
    setTimeout(async () => {
      const randomProfile = DUMMY_PROFILES[Math.floor(Math.random() * DUMMY_PROFILES.length)];
      setStyleProfile(randomProfile);
      setIsScanning(false);
      try {
        await AsyncStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(randomProfile));
      } catch (e) {
        console.error('Failed to persist style dna', e);
      }
    }, 2800);
  };

  const resetProfile = async () => {
    setStyleProfile(null);
    setUploadedMedia(null);
    try {
      await AsyncStorage.removeItem(DNA_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove dna', e);
    }
  };

  const saveMeasurements = async () => {
    try {
      await AsyncStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(measurements));
      setShowMeasureModal(false);
      Alert.alert('Gespeichert', 'Deine 3D-Avatar Proportionen wurden aktualisiert!');
    } catch (e) {
      console.error('Failed to save measurements', e);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 pt-16 px-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Unified Header */}
        <Header
          title="Style-DNA"
          subtitle="Dein persönliches Fashion- & Avatar-Profil"
          badge={{ label: 'AI VISION', variant: 'purple' }}
          rightAction={
            <Button
              onPress={logout}
              variant="danger"
              size="sm"
            >
              Logout
            </Button>
          }
        />

        {!styleProfile && !isScanning && (
          <Card variant="elevated" className="mt-4 items-center p-8">
            <View className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mb-6 border border-purple-500/20">
              <Text className="text-4xl">🧬</Text>
            </View>
            <Text className="text-2xl font-black text-center text-black dark:text-white mb-3">
              Wer bist du wirklich?
            </Text>
            <Text className="text-zinc-500 dark:text-zinc-400 text-xs text-center mb-6 px-2 leading-relaxed">
              Lade ein Foto oder kurzes Video von deinem Lieblingsoutfit hoch. Unsere Vision-KI analysiert Schnitte, Farben und Vibe und generiert deine exakte Style-DNA.
            </Text>

            <Button
              onPress={startScan}
              size="lg"
              className="w-full"
              icon={<Text className="text-lg">📸</Text>}
            >
              Outfit per Foto / Video scannen
            </Button>
          </Card>
        )}

        {isScanning && (
          <Card variant="elevated" className="mt-8 items-center justify-center py-12">
            {uploadedMedia && (
              <Image source={{ uri: uploadedMedia }} className="w-28 h-28 rounded-2xl mb-6 opacity-60" blurRadius={8} />
            )}
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="text-xl font-bold text-black dark:text-white mt-5 mb-1.5">
              Analysiere Vibe & Proportionen...
            </Text>
            <Text className="text-zinc-500 text-xs text-center px-4">
              Vision-KI extrahiert Schnitte, Farbpalette und Silhouette für deinen 3D-Avatar.
            </Text>
          </Card>
        )}

        {styleProfile && !isScanning && (
          <View className="mt-2 space-y-5 gap-4">
            
            {/* The Result Card */}
            <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-purple-400 font-extrabold uppercase tracking-widest text-[11px]">
                  Erkannter Archetyp
                </Text>
                <Badge label="100% MATCH" variant="purple" icon="✨" />
              </View>
              
              <Text className="text-3xl font-black text-white mb-1">{styleProfile.name}</Text>
              <Text className="text-purple-300 font-bold text-base mb-4">{styleProfile.archetype}</Text>
              
              <Text className="text-zinc-300 text-xs leading-relaxed mb-5">
                {styleProfile.description}
              </Text>

              {/* Vibe Tags */}
              <View className="flex-row flex-wrap gap-2 mb-5">
                {styleProfile.vibe.map((tag, i) => (
                  <View key={i} className="bg-zinc-800/90 px-3 py-1.5 rounded-xl border border-zinc-700">
                    <Text className="text-white text-xs font-semibold">#{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Color Palette */}
              <Text className="text-xs font-bold text-zinc-400 mb-2.5 uppercase tracking-wider">Kern-Farbpalette</Text>
              <View className="flex-row gap-2.5">
                {styleProfile.colors.map((colorClass, i) => (
                  <View key={i} className={`w-9 h-9 rounded-xl shadow-sm ${colorClass} border border-zinc-700`} />
                ))}
              </View>
            </View>

            {/* 3D Avatar Try-On Dimensions Card */}
            <View className="bg-zinc-900/90 border border-zinc-800 rounded-[28px] p-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-zinc-800 rounded-xl items-center justify-center mr-3 border border-zinc-700">
                    <Text className="text-lg">🧍‍♂️</Text>
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">3D-Avatar Maße</Text>
                    <Text className="text-zinc-400 text-xs">{measurements.height} cm · {measurements.waist} cm Taille</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowMeasureModal(true)}
                  className="bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700"
                >
                  <Text className="text-white font-bold text-xs">Bearbeiten ✏️</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-zinc-400 text-xs leading-relaxed">
                Diese Maße bestimmen die realistische Silhouette deines Runway-Models im Stylist-Tab.
              </Text>
            </View>

            {/* Retake Button */}
            <TouchableOpacity onPress={resetProfile} className="items-center py-3">
              <Text className="text-zinc-500 font-bold text-xs">🔄 Scan wiederholen & neues Profil erstellen</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>

      {/* Body Measurements Edit Modal */}
      <Modal
        visible={showMeasureModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMeasureModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60 backdrop-blur-sm">
          <View className="bg-zinc-950 p-6 rounded-t-[36px] border-t border-zinc-800">
            <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-zinc-800">
              <Text className="text-white font-bold text-lg">Körpermaße für 3D-Model</Text>
              <TouchableOpacity onPress={() => setShowMeasureModal(false)}>
                <Text className="text-zinc-400 font-bold">Abbrechen</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-3 gap-3 mb-6">
              <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">Körpergröße (cm)</Text>
                <TextInput
                  value={measurements.height}
                  onChangeText={(v) => setMeasurements(p => ({ ...p, height: v }))}
                  keyboardType="numeric"
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white font-bold"
                />
              </View>
              <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">Brustumfang (cm)</Text>
                <TextInput
                  value={measurements.chest}
                  onChangeText={(v) => setMeasurements(p => ({ ...p, chest: v }))}
                  keyboardType="numeric"
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white font-bold"
                />
              </View>
              <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">Taillenumfang (cm)</Text>
                <TextInput
                  value={measurements.waist}
                  onChangeText={(v) => setMeasurements(p => ({ ...p, waist: v }))}
                  keyboardType="numeric"
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white font-bold"
                />
              </View>
              <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">Hüftumfang (cm)</Text>
                <TextInput
                  value={measurements.hips}
                  onChangeText={(v) => setMeasurements(p => ({ ...p, hips: v }))}
                  keyboardType="numeric"
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white font-bold"
                />
              </View>
            </View>

            <Button onPress={saveMeasurements} size="lg" className="w-full">
              Speichern & Avatar anpassen
            </Button>
          </View>
        </View>
      </Modal>

    </View>
  );
}
