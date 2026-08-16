import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem } from '../types/wardrobe';

interface WardrobeContextType {
  items: WardrobeItem[];
  isLoading: boolean;
  addItem: (item: WardrobeItem) => Promise<void>;
  updateItem: (item: WardrobeItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

const STORAGE_KEY = '@wardrobe_items';

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wardrobe items', e);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: WardrobeItem) => {
    try {
      const newItems = [...items, item];
      setItems(newItems);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to add item', e);
    }
  };

  const updateItem = async (updatedItem: WardrobeItem) => {
    try {
      const newItems = items.map(item => item.id === updatedItem.id ? updatedItem : item);
      setItems(newItems);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to update item', e);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to delete item', e);
    }
  };

  return (
    <WardrobeContext.Provider value={{ items, isLoading, addItem, updateItem, deleteItem }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
