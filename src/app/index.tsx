import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ItemDetailsModal } from '../components/ItemDetailsModal';
import { StyleDeciderModal } from '../components/StyleDeciderModal';
import { useWardrobe } from '../context/WardrobeContext';
import type { WardrobeItem, WardrobeSource } from '../types/wardrobe';

export default function WardrobeScreen() {
  const {
    items,
    isLoading,
    error,
    isCloudBacked,
    addItem,
    updateItem,
    deleteItem,
  } = useWardrobe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [showStyleDecider, setShowStyleDecider] = useState(false);

  const handleAddPress = () => {
    Alert.alert('Neues Item hinzufügen', 'Wähle eine Option:', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Foto aufnehmen', onPress: () => void takePhoto() },
      { text: 'Aus Galerie wählen', onPress: () => void pickImage() },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung fehlt',
        'Wir benötigen Zugriff auf deine Kamera.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      await processAndSaveImage(result.assets[0].uri, 'camera');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung fehlt',
        'Wir benötigen Zugriff auf deine Fotos.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      await processAndSaveImage(result.assets[0].uri, 'library');
    }
  };

  const processAndSaveImage = async (
    uri: string,
    source: Extract<WardrobeSource, 'camera' | 'library'>,
  ) => {
    setIsProcessing(true);

    try {
      const newItem = await addItem({
        localImageUri: uri,
        source,
      });

      // Metadata starts deliberately neutral. A real AI analysis pipeline will
      // enrich the item later instead of pretending a timeout is AI work.
      setSelectedItem(newItem);
    } catch (saveError: unknown) {
      console.error('Failed to add wardrobe item', saveError);
      Alert.alert(
        'Speichern fehlgeschlagen',
        isCloudBacked
          ? 'Das Kleidungsstück konnte nicht in deinen Cloud-Schrank geladen werden. Bitte Verbindung prüfen und erneut versuchen.'
          : 'Das Kleidungsstück konnte lokal nicht gespeichert werden.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveItem = async (updatedItem: WardrobeItem) => {
    try {
      await updateItem(updatedItem);
      setSelectedItem(null);
    } catch (saveError: unknown) {
      console.error('Failed to update wardrobe item', saveError);
      Alert.alert(
        'Änderung nicht gespeichert',
        'Bitte versuche es erneut. Deine Änderung wurde nicht als erfolgreich markiert.',
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      setSelectedItem(null);
    } catch (deleteError: unknown) {
      console.error('Failed to delete wardrobe item', deleteError);
      Alert.alert(
        'Löschen fehlgeschlagen',
        'Das Kleidungsstück konnte nicht sicher gelöscht werden.',
      );
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-16 px-4">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-3xl font-extrabold text-black dark:text-white">
            Mein Schrank
          </Text>
          <Text className="text-zinc-500 text-xs mt-0.5">
            {items.length} digitalisierte Teile
            {isCloudBacked ? ' · Cloud' : ' · Entwicklung lokal'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowStyleDecider(true)}
          className="bg-purple-600/15 border border-purple-500/40 px-3.5 py-2 rounded-2xl flex-row items-center shadow-sm"
        >
          <Text className="text-sm mr-1.5">🔮</Text>
          <Text className="text-purple-600 dark:text-purple-300 font-bold text-xs">
            Style vorgeben
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3">
          <Text className="text-red-600 dark:text-red-300 text-xs">
            {error}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => setShowStyleDecider(true)}
        className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-3.5 mb-5 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-xl bg-purple-600/30 items-center justify-center mr-3 border border-purple-400/30">
            <Text className="text-lg">🧠</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-xs">
              Keine Ahnung was du anziehen sollst?
            </Text>
            <Text className="text-purple-200/80 text-[11px]">
              Outfit-Auswahl aus deinem Schrank
            </Text>
          </View>
        </View>
        <View className="bg-purple-600 px-3 py-1.5 rounded-xl">
          <Text className="text-white font-extrabold text-[11px]">Wählen</Text>
        </View>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between mb-24">
          {isLoading ? (
            <View className="w-full py-10 items-center">
              <ActivityIndicator size="large" color="#208AEF" />
            </View>
          ) : null}

          {!isLoading &&
            items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedItem(item)}
                className="w-[48%] aspect-square bg-white dark:bg-zinc-900 rounded-2xl mb-4 items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-[85%] h-[85%]"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-[85%] h-[85%] items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <Text className="text-zinc-400 text-xs">Bild nicht verfügbar</Text>
                  </View>
                )}
                <View className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-lg py-1 px-2">
                  <Text
                    className="text-white text-[10px] font-bold text-center"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

          {!isLoading &&
            items.length === 0 &&
            !isProcessing &&
            [1, 2, 3, 4, 5, 6].map((idx) => (
              <View
                key={`placeholder-${idx}`}
                className="w-[48%] aspect-square bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl mb-4 items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800"
              >
                <Text className="text-zinc-400 dark:text-zinc-600 text-xs font-semibold">
                  Leer
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleAddPress}
        disabled={isProcessing}
        className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 dark:bg-white rounded-full items-center justify-center shadow-2xl"
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white dark:text-black text-3xl mb-1">+</Text>
        )}
      </TouchableOpacity>

      <ItemDetailsModal
        visible={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSave={(item) => void handleSaveItem(item)}
        onDelete={(id) => void handleDeleteItem(id)}
      />

      <StyleDeciderModal
        visible={showStyleDecider}
        onClose={() => setShowStyleDecider(false)}
      />
    </View>
  );
}
