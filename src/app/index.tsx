import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ItemDetailsModal } from '../components/ItemDetailsModal';
import { useWardrobe } from '../context/WardrobeContext';
import { isWardrobeImageUploadCanceled } from '../features/wardrobe/services/wardrobe-storage-service';
import type { WardrobeItem, WardrobeSource } from '../types/wardrobe';

function aiBadge(item: WardrobeItem): string | null {
  switch (item.aiStatus) {
    case 'pending':
      return 'KI…';
    case 'completed':
      return item.aiConfidence === null
        ? 'KI ✓'
        : `KI ${Math.round(item.aiConfidence * 100)}%`;
    case 'failed':
      return 'KI !';
    case 'not_requested':
      return null;
  }
}

function WardrobeEmptyState({ isProcessing }: { isProcessing: boolean }) {
  if (isProcessing) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap justify-between">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <View
          key={`placeholder-${index}`}
          className="w-[48%] aspect-square bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl mb-4 items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800"
        >
          <Text className="text-zinc-400 dark:text-zinc-600 text-xs font-semibold">
            Leer
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function WardrobeScreen() {
  const {
    items,
    isLoading,
    error,
    isCloudBacked,
    uploadProgress,
    addItem,
    updateItem,
    deleteItem,
    analyzeItem,
    cancelUpload,
  } = useWardrobe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = selectedItemId
    ? (items.find((item) => item.id === selectedItemId) ?? null)
    : null;
  const uploadPercentage =
    uploadProgress === null ? null : Math.round(uploadProgress * 100);
  const uploadProgressWidth =
    uploadPercentage === null
      ? ('0%' as `${number}%`)
      : (`${uploadPercentage}%` as `${number}%`);

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

      setSelectedItemId(newItem.id);

      if (isCloudBacked) {
        void analyzeItem(newItem.id).catch((analysisError: unknown) => {
          console.error('Automatic garment analysis failed', analysisError);
        });
      }
    } catch (saveError: unknown) {
      if (isWardrobeImageUploadCanceled(saveError)) {
        return;
      }

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
      setSelectedItemId(null);
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
      setSelectedItemId(null);
    } catch (deleteError: unknown) {
      console.error('Failed to delete wardrobe item', deleteError);
      Alert.alert(
        'Löschen fehlgeschlagen',
        'Das Kleidungsstück konnte nicht sicher gelöscht werden.',
      );
    }
  };

  const renderItem = ({ item }: { item: WardrobeItem }) => {
    const badge = aiBadge(item);

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.name} öffnen`}
        onPress={() => setSelectedItemId(item.id)}
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

        {badge ? (
          <View className="absolute top-2 right-2 bg-indigo-600/90 rounded-full px-2 py-1">
            <Text className="text-white text-[9px] font-bold">{badge}</Text>
          </View>
        ) : null}

        <View className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-lg py-1 px-2">
          <Text
            className="text-white text-[10px] font-bold text-center"
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-16 px-4">
      <View className="mb-5">
        <Text className="text-3xl font-extrabold text-black dark:text-white">
          Mein Schrank
        </Text>
        <Text className="text-zinc-500 text-xs mt-0.5">
          {items.length} digitalisierte Teile
          {isCloudBacked ? ' · Cloud + KI' : ' · Entwicklung lokal'}
        </Text>
      </View>

      {error ? (
        <View
          accessibilityRole="alert"
          className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3"
        >
          <Text className="text-red-600 dark:text-red-300 text-xs">
            {error}
          </Text>
        </View>
      ) : null}

      {uploadPercentage !== null ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Kleidungsstück wird hochgeladen"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: uploadPercentage,
            text: `${uploadPercentage} Prozent`,
          }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                Bild wird sicher hochgeladen
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                {uploadPercentage}% übertragen
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Bildupload abbrechen"
              onPress={cancelUpload}
              className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10"
            >
              <Text className="text-red-600 dark:text-red-300 text-xs font-bold">
                Abbrechen
              </Text>
            </TouchableOpacity>
          </View>

          <View className="h-2 bg-blue-500/15 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-600 rounded-full"
              style={{ width: uploadProgressWidth }}
            />
          </View>
        </View>
      ) : null}

      <View className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-5">
        <Text className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">
          Dein Schrank ist die Basis des Stylists
        </Text>
        <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 leading-5">
          Je vollständiger Kategorie, Farbe und Stil gepflegt sind, desto besser
          kann Omni Fashion echte Outfits aus deinen eigenen Teilen bilden.
        </Text>
      </View>

      {isLoading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Kleiderschrank wird geladen"
          className="flex-1 items-center justify-center"
        >
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: 96 }}
          ListEmptyComponent={
            <WardrobeEmptyState isProcessing={isProcessing} />
          }
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Neues Kleidungsstück hinzufügen"
        accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
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
        canAnalyze={isCloudBacked}
        onClose={() => setSelectedItemId(null)}
        onSave={(item) => void handleSaveItem(item)}
        onDelete={(id) => void handleDeleteItem(id)}
        onAnalyze={analyzeItem}
      />
    </View>
  );
}
