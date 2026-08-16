import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { WardrobeItem } from '../types/wardrobe';

interface Props {
  visible: boolean;
  item: WardrobeItem | null;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Accessory', 'Outerwear', 'Other'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter', 'All'];

export function ItemDetailsModal({ visible, item, onClose, onSave, onDelete }: Props) {
  if (!item) return null;

  const [name, setName] = useState(item.name || '');
  const [category, setCategory] = useState(item.category || 'Other');
  const [season, setSeason] = useState(item.season || 'All');
  const [color, setColor] = useState(item.color || 'Unbekannt');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'Other');
      setSeason(item.season || 'All');
      setColor(item.color || 'Unbekannt');
    }
  }, [item]);

  const handleSave = () => {
    onSave({
      ...item,
      name,
      category,
      season,
      color,
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-zinc-900 rounded-t-3xl h-[85%] overflow-hidden">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-zinc-500">Abbrechen</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg dark:text-white">Item Details</Text>
            <TouchableOpacity onPress={handleSave} className="p-2">
              <Text className="text-blue-500 font-bold">Speichern</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            <Image 
              source={{ uri: item.imageUrl }} 
              className="w-full h-64 rounded-2xl mb-6" 
              resizeMode="cover"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name des Kleidungsstücks..."
              className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-6 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Farbe</Text>
            <TextInput
              value={color}
              onChangeText={setColor}
              placeholder="z.B. Schwarz, Weiß, Blau..."
              className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-6 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Kategorie</Text>
            <View className="flex-row flex-wrap mb-6">
              {CATEGORIES.map(c => (
                <TouchableOpacity 
                  key={c}
                  onPress={() => setCategory(c as any)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${category === c ? 'bg-black dark:bg-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                >
                  <Text className={category === c ? 'text-white dark:text-black font-bold' : 'text-black dark:text-white'}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Saison</Text>
            <View className="flex-row flex-wrap mb-8">
              {SEASONS.map(s => (
                <TouchableOpacity 
                  key={s}
                  onPress={() => setSeason(s as any)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${season === s ? 'bg-black dark:bg-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                >
                  <Text className={season === s ? 'text-white dark:text-black font-bold' : 'text-black dark:text-white'}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              onPress={() => onDelete(item.id)}
              className="bg-red-500/10 border border-red-500 p-4 rounded-xl items-center mb-10"
            >
              <Text className="text-red-500 font-bold">Item löschen</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
