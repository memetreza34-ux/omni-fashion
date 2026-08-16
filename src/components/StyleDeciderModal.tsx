import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useWardrobe } from '../context/WardrobeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyStyle?: (styleTitle: string) => void;
}

interface CuratedLook {
  styleName: string;
  tagline: string;
  avatarMatchRate: number;
  whyThisStyle: string;
  avatarAdvantage: string;
  recommendedTop: string;
  recommendedBottom: string;
  recommendedShoes: string;
  colorPalette: string[];
}

const CURATED_STYLES: CuratedLook[] = [
  {
    styleName: 'Quiet Luxury Minimalist',
    tagline: 'Mühelos elegant, clean und zeitlos',
    avatarMatchRate: 98,
    whyThisStyle: 'Wenn du dich nicht entscheiden kannst: Monochromes Layering nimmt die morgendliche Entscheidungsüberlastung komplett weg.',
    avatarAdvantage: 'Betont die vertikale Linie deines Avatars optimal und lässt dich 5 cm größer und gestreckter wirken.',
    recommendedTop: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    recommendedBottom: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=500&q=80',
    recommendedShoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
    colorPalette: ['#18181b', '#f4f4f5', '#71717a']
  },
  {
    styleName: 'Relaxed Street-Elegance',
    tagline: 'Oversized Komfort trifft auf scharfe Details',
    avatarMatchRate: 95,
    whyThisStyle: 'Perfekt für unbeständiges Wetter. Schafft sofortigen Streetwear-Charme, ohne nachlässig zu wirken.',
    avatarAdvantage: 'Die lockere Schulterpartie balanciert die Hüftsilhouette deines 3D-Models perfekt aus.',
    recommendedTop: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=80',
    recommendedBottom: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&w=500&q=80',
    recommendedShoes: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80',
    colorPalette: ['#3f3f46', '#27272a', '#e4e4e7']
  },
  {
    styleName: 'Nordic Clean Casual',
    tagline: 'Helle Töne, strukturierte Stoffe, volle Frische',
    avatarMatchRate: 93,
    whyThisStyle: 'Hellt die Stimmung auf und funktioniert bei jeder Tageszeit – vom Frühstück bis zum Abendessen.',
    avatarAdvantage: 'Hoher Farbkontrast hebt das Gesicht und die Haltung deines Avatars sofort in den Mittelpunkt.',
    recommendedTop: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80',
    recommendedBottom: 'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=500&q=80',
    recommendedShoes: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80',
    colorPalette: ['#fafafa', '#a1a1aa', '#1e293b']
  }
];

export function StyleDeciderModal({ visible, onClose, onApplyStyle }: Props) {
  const { items } = useWardrobe();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [curatedIndex, setCuratedIndex] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);

  const look = CURATED_STYLES[curatedIndex];

  const handleStartDecider = () => {
    setIsAnalyzing(true);
    // Simuliert tiefe KI-Schrank- und Avatar-Analyse
    setTimeout(() => {
      const nextIdx = Math.floor(Math.random() * CURATED_STYLES.length);
      setCuratedIndex(nextIdx);
      setIsAnalyzing(false);
      setHasScanned(true);
    }, 1200);
  };

  const handleAccept = () => {
    if (onApplyStyle) {
      onApplyStyle(look.styleName);
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60 backdrop-blur-sm">
        <View className="bg-zinc-950 rounded-t-[36px] h-[90%] overflow-hidden border-t border-zinc-800 p-6">
          
          {/* Top Bar */}
          <View className="flex-row justify-between items-center pb-4 border-b border-zinc-800/80 mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 items-center justify-center mr-2.5">
                <Text className="text-base">🔮</Text>
              </View>
              <View>
                <Text className="text-white font-extrabold text-lg">KI-Style-Entscheider</Text>
                <Text className="text-zinc-400 text-xs">Keine Ahnung was anziehen? Lass die KI wählen.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              <Text className="text-zinc-400 font-bold text-xs">Schließen</Text>
            </TouchableOpacity>
          </View>

          {isAnalyzing ? (
            <View className="flex-1 items-center justify-center px-6">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-white font-extrabold text-xl mt-6 mb-2 text-center">
                Scanne deinen Kleiderschrank...
              </Text>
              <Text className="text-zinc-400 text-xs text-center leading-relaxed">
                Berechne Farbkontraste, Wetterdaten und optimale Schnittproportionen für deinen 3D-Avatar ({items.length} Schrank-Teile gefunden).
              </Text>
            </View>
          ) : !hasScanned ? (
            <View className="flex-1 items-center justify-center px-4">
              <View className="w-24 h-24 rounded-full bg-purple-900/30 border border-purple-500/40 items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                <Text className="text-4xl animate-pulse">🧠</Text>
              </View>
              <Text className="text-2xl font-black text-white text-center mb-3">
                Entscheidungs-Lähmung?
              </Text>
              <Text className="text-zinc-400 text-sm text-center leading-relaxed mb-8 px-4">
                Unsere KI analysiert alle deine vorhandenen Teile und wählt heute den perfekten, stilsicheren Look aus, der optimal zu deiner Figur & deinem Avatar passt.
              </Text>

              <TouchableOpacity
                onPress={handleStartDecider}
                className="w-full bg-purple-600 py-4 rounded-2xl items-center justify-center shadow-xl shadow-purple-600/40 flex-row"
              >
                <Text className="text-white font-extrabold text-base mr-2">✨ Style für heute festlegen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              
              {/* Result Header Badge */}
              <View className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-4 mb-5">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                    Dein vorgeschriebener Stil heute:
                  </Text>
                  <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Text className="text-emerald-300 text-[10px] font-black">{look.avatarMatchRate}% Avatar-Match</Text>
                  </View>
                </View>
                <Text className="text-white font-black text-2xl mb-1">{look.styleName}</Text>
                <Text className="text-purple-200/90 text-xs italic">{look.tagline}</Text>
              </View>

              {/* Look Preview Collage */}
              <View className="bg-zinc-900 rounded-3xl p-4 mb-5 border border-zinc-800 items-center">
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-3 tracking-wider">
                  Kombinierte Schrank-Teile
                </Text>
                <View className="flex-row justify-center space-x-3 gap-2">
                  <View className="w-24 h-24 rounded-2xl bg-zinc-800 p-1 border border-zinc-700">
                    <Image source={{ uri: look.recommendedTop }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  </View>
                  <View className="w-24 h-24 rounded-2xl bg-zinc-800 p-1 border border-zinc-700">
                    <Image source={{ uri: look.recommendedBottom }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  </View>
                  <View className="w-24 h-24 rounded-2xl bg-zinc-800 p-1 border border-zinc-700">
                    <Image source={{ uri: look.recommendedShoes }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  </View>
                </View>
              </View>

              {/* Begründung 1: Warum dieser Style? */}
              <View className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 mb-3">
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">🎯 Warum diese Wahl?</Text>
                <Text className="text-zinc-300 text-xs leading-relaxed">
                  {look.whyThisStyle}
                </Text>
              </View>

              {/* Begründung 2: Warum passt es zum Avatar? */}
              <View className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 mb-6">
                <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">🧍‍♂️ Vorteil für deinen Avatar & Silhouette:</Text>
                <Text className="text-zinc-300 text-xs leading-relaxed">
                  {look.avatarAdvantage}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="space-y-3 gap-2 mb-8">
                <TouchableOpacity
                  onPress={handleAccept}
                  className="w-full bg-purple-600 py-4 rounded-2xl items-center justify-center shadow-lg shadow-purple-600/30"
                >
                  <Text className="text-white font-extrabold text-base">🔥 Diesen Look heute tragen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartDecider}
                  className="w-full bg-zinc-900 py-3 rounded-2xl items-center justify-center border border-zinc-800"
                >
                  <Text className="text-zinc-400 font-bold text-xs">🎲 Anderen Style vorschlagen</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}
