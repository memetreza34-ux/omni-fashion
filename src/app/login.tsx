import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      alert('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    login();
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 justify-center px-8">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-black dark:text-white mb-2">Omni-Fashion</Text>
        <Text className="text-zinc-500 text-center">Dein digitaler Kleiderschrank & Tauschbörse</Text>
      </View>

      <View className="space-y-4 mb-8">
        <TextInput
          placeholder="E-Mail"
          placeholderTextColor="#a1a1aa"
          value={email}
          onChangeText={setEmail}
          className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-black dark:text-white"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Passwort"
          placeholderTextColor="#a1a1aa"
          value={password}
          onChangeText={setPassword}
          className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-black dark:text-white mt-4"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        onPress={handleLogin}
        className="bg-black dark:bg-white p-4 rounded-xl items-center"
      >
        <Text className="text-white dark:text-black font-bold text-lg">Einloggen</Text>
      </TouchableOpacity>
    </View>
  );
}
