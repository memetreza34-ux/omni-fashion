import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Badge } from '../components/ui';

export default function LoginScreen() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@omnifashion.app');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Alex Taylor');

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eingabe erforderlich', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }
    login();
  };

  const features = [
    { icon: '👗', title: 'Smart Wardrobe', desc: 'Schrank digitalisieren & KI-Outfits' },
    { icon: '🧍‍♂️', title: '3D Runway Model', desc: '360° Passform & Silhouette-Check' },
    { icon: '🔄', title: 'OmniSwap Hub', desc: 'Bargeldloser P2P-Kleidertausch' }
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-light dark:bg-surface-dark"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Glow Effects in Background */}
        <View className="absolute top-12 left-1/2 -ml-32 w-64 h-64 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <View className="absolute bottom-16 right-4 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-3xl bg-brand-600 items-center justify-center shadow-xl shadow-brand-500/40 mb-3 border border-brand-400/30">
            <Text className="text-3xl">✨</Text>
          </View>
          <View className="flex-row items-center space-x-2 gap-2 mb-1">
            <Text className="text-3xl font-black text-black dark:text-white tracking-tight">
              Omni-Fashion
            </Text>
            <Badge label="SUPER APP" variant="brand" />
          </View>
          <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-center">
            Digitaler Schrank · 3D Runway · Circular Swap
          </Text>
        </View>

        {/* 3 App Pillars Preview Carousel */}
        <View className="flex-row justify-between mb-8">
          {features.map((f, i) => (
            <View key={i} className="flex-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-3 rounded-2xl mx-1 border border-zinc-200 dark:border-zinc-800 items-center">
              <Text className="text-xl mb-1">{f.icon}</Text>
              <Text className="text-black dark:text-white text-[11px] font-bold text-center" numberOfLines={1}>{f.title}</Text>
              <Text className="text-zinc-500 text-[9px] text-center mt-0.5" numberOfLines={2}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Auth Mode Toggle */}
        <View className="flex-row bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl mb-6 border border-zinc-200 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => setIsRegister(false)}
            className={`flex-1 py-2.5 rounded-xl items-center ${!isRegister ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''}`}
          >
            <Text className={`text-xs font-bold ${!isRegister ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
              Einloggen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsRegister(true)}
            className={`flex-1 py-2.5 rounded-xl items-center ${isRegister ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''}`}
          >
            <Text className={`text-xs font-bold ${isRegister ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
              Konto erstellen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Form */}
        <View className="space-y-3.5 gap-3 mb-6">
          {isRegister && (
            <View>
              <Text className="text-zinc-500 text-xs font-bold uppercase mb-1.5 ml-1">Name</Text>
              <TextInput
                placeholder="Dein Vor- und Nachname"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={setName}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl text-black dark:text-white text-sm"
              />
            </View>
          )}

          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-1.5 ml-1">E-Mail</Text>
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor="#71717a"
              value={email}
              onChangeText={setEmail}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl text-black dark:text-white text-sm"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-1.5 ml-1">Passwort</Text>
            <TextInput
              placeholder="Mindestens 8 Zeichen"
              placeholderTextColor="#71717a"
              value={password}
              onChangeText={setPassword}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl text-black dark:text-white text-sm"
              secureTextEntry
            />
          </View>
        </View>

        {/* Action Button */}
        <Button
          onPress={handleAuth}
          size="lg"
          className="mb-4 shadow-xl"
        >
          {isRegister ? '🚀 Jetzt kostenlos registrieren' : '✨ In die App einloggen'}
        </Button>

        {/* Quick Demo Login Helper */}
        <TouchableOpacity
          onPress={login}
          className="items-center py-2"
        >
          <Text className="text-zinc-500 text-xs font-semibold">
            ⚡️ Schneller 1-Klick Demo-Login (ohne Registrierung)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
