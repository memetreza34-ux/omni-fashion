import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface OutfitItems {
  top: string;
  bottom: string;
  shoes: string;
}

interface Props {
  outfit: OutfitItems;
  activeMood: string;
}

const ANGLES = [
  { id: 'front', label: 'Vorne (0°)', rotation: 0, tag: 'Front View' },
  {
    id: 'threeQuarter',
    label: '3/4 Winkel (45°)',
    rotation: 45,
    tag: '3/4 Angle',
  },
  { id: 'side', label: 'Profil (90°)', rotation: 90, tag: 'Side Profile' },
  { id: 'back', label: 'Rücken (180°)', rotation: 180, tag: 'Back View' },
];

const POSES = [
  { id: 'runway', name: 'Runway Walk', icon: '🚶‍♂️' },
  { id: 'power', name: 'Casual Stand', icon: '🧍' },
  { id: 'street', name: 'Streetwear Pose', icon: '🕶️' },
];

export function AvatarViewer3D({ outfit, activeMood }: Props) {
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [activePose, setActivePose] = useState('runway');
  const [bodyType, setBodyType] = useState<'slim' | 'athletic' | 'relaxed'>(
    'athletic',
  );

  const angle = ANGLES[currentAngleIndex];

  const handleNextAngle = () => {
    setCurrentAngleIndex((prev) => (prev + 1) % ANGLES.length);
  };

  const handlePrevAngle = () => {
    setCurrentAngleIndex((prev) => (prev - 1 + ANGLES.length) % ANGLES.length);
  };

  const getPerspectiveStyle = () => {
    switch (angle.id) {
      case 'threeQuarter':
        return {
          perspectiveLabel: 'Dynamische 3/4 Silhouette',
        };
      case 'side':
        return {
          perspectiveLabel: 'Seitenprofil (Schulter & Beinlänge)',
        };
      case 'back':
        return {
          perspectiveLabel: 'Rückenansicht & Saumfall',
        };
      default:
        return {
          perspectiveLabel: 'Frontale Runway-Ansicht',
        };
    }
  };

  const perspective = getPerspectiveStyle();

  return (
    <View className="bg-zinc-950 rounded-[36px] p-5 border border-zinc-800 shadow-2xl relative overflow-hidden my-3">
      <View className="absolute top-0 left-1/2 -ml-32 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <View className="absolute bottom-10 right-4 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      <View className="flex-row justify-between items-center mb-4 z-10">
        <View className="flex-row items-center">
          <View className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
          <Text className="text-white font-bold text-base tracking-wide">
            3D Runway Model
          </Text>
          <View className="ml-2 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-zinc-700">
            <Text className="text-zinc-300 text-xs font-semibold">
              {angle.tag}
            </Text>
          </View>
        </View>

        <View className="flex-row bg-zinc-900 rounded-xl p-0.5 border border-zinc-800">
          {(['slim', 'athletic', 'relaxed'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setBodyType(type)}
              className={`px-2 py-1 rounded-lg ${
                bodyType === type ? 'bg-zinc-800 border border-zinc-700' : ''
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  bodyType === type ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {type === 'slim'
                  ? 'Slim'
                  : type === 'athletic'
                    ? 'Athletic'
                    : 'Relaxed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text className="text-zinc-500 text-xs mb-3">Mood: {activeMood}</Text>

      <View className="w-full h-[410px] bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 rounded-[28px] items-center justify-center relative overflow-hidden border border-zinc-800/80">
        <View className="absolute inset-0 opacity-20">
          <View className="w-full h-full border-b border-zinc-700/50" />
        </View>

        <View className="absolute top-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800 z-30">
          <Text className="text-zinc-400 text-xs font-medium">
            📐 {perspective.perspectiveLabel}
          </Text>
        </View>

        <View className="items-center justify-center relative z-20 w-full py-4">
          <View className="w-14 h-16 rounded-full bg-zinc-800/90 border border-zinc-700/80 items-center justify-center mb-1 shadow-lg shadow-black/50">
            <Text className="text-base">
              {activePose === 'street' ? '🕶️' : '👤'}
            </Text>
            <View className="w-6 h-1 bg-zinc-600 rounded-full mt-0.5 opacity-60" />
          </View>

          <View
            className="w-44 h-40 bg-zinc-900/90 rounded-2xl p-2 z-20 border border-zinc-700 shadow-xl"
            style={{
              transform: [
                {
                  rotate:
                    angle.id === 'threeQuarter'
                      ? '4deg'
                      : angle.id === 'side'
                        ? '12deg'
                        : '-2deg',
                },
              ],
            }}
          >
            <Image
              source={{ uri: outfit.top }}
              className="w-full h-full rounded-xl"
              resizeMode="cover"
            />
            {angle.id === 'back' ? (
              <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                <Text className="text-white/80 text-xs font-bold tracking-widest uppercase">
                  Back Seam
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="w-40 h-44 bg-zinc-900/90 rounded-2xl p-2 z-10 -mt-6 border border-zinc-700 shadow-lg"
            style={{
              transform: [
                {
                  rotate:
                    angle.id === 'threeQuarter'
                      ? '-3deg'
                      : angle.id === 'side'
                        ? '6deg'
                        : '2deg',
                },
              ],
            }}
          >
            <Image
              source={{ uri: outfit.bottom }}
              className="w-full h-full rounded-xl"
              resizeMode="cover"
            />
          </View>

          <View className="w-36 h-24 bg-zinc-900/90 rounded-xl p-1.5 z-30 -mt-5 border border-zinc-700 shadow-2xl">
            <Image
              source={{ uri: outfit.shoes }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="w-48 h-6 bg-black/80 rounded-full blur-md -mt-2 z-0 scale-y-50 border-t border-zinc-800/40" />
        </View>

        <TouchableOpacity
          onPress={handlePrevAngle}
          className="absolute left-3 top-1/2 -mt-6 w-11 h-11 bg-zinc-900/90 backdrop-blur-md rounded-full items-center justify-center border border-zinc-700 z-30 active:scale-90"
        >
          <Text className="text-white text-xl font-bold">‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNextAngle}
          className="absolute right-3 top-1/2 -mt-6 w-11 h-11 bg-zinc-900/90 backdrop-blur-md rounded-full items-center justify-center border border-zinc-700 z-30 active:scale-90"
        >
          <Text className="text-white text-xl font-bold">›</Text>
        </TouchableOpacity>

        <View className="absolute bottom-3 flex-row bg-zinc-900/90 backdrop-blur-md px-2 py-1 rounded-2xl border border-zinc-800 z-30">
          {ANGLES.map((ang, idx) => (
            <TouchableOpacity
              key={ang.id}
              onPress={() => setCurrentAngleIndex(idx)}
              className={`px-3 py-1.5 rounded-xl mx-0.5 ${
                currentAngleIndex === idx ? 'bg-blue-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  currentAngleIndex === idx ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {ang.rotation}°
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mt-4 pt-3 border-t border-zinc-800/80">
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">
          Figur-Pose & Dynamik
        </Text>
        <View className="flex-row justify-between">
          {POSES.map((pose) => (
            <TouchableOpacity
              key={pose.id}
              onPress={() => setActivePose(pose.id)}
              className={`flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-xl mx-1 border ${
                activePose === pose.id
                  ? 'bg-zinc-800 border-blue-500 shadow-sm'
                  : 'bg-zinc-900/70 border-zinc-800'
              }`}
            >
              <Text className="text-sm mr-1.5">{pose.icon}</Text>
              <Text
                className={`text-xs font-bold ${
                  activePose === pose.id ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {pose.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
