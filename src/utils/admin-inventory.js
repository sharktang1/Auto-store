import { db } from '../libs/firebase-config.mjs';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

const INVENTORY_COLLECTION = 'inventory';

// Validation helper functions
const isValidItem = (item) => {
  const requiredFields = ['atNo', 'name', 'brand', 'category', 'price', 'stock'];
  return requiredFields.every(field => {
    const value = item[field];
    return value !== undefined && value !== null && value !== '';
  });
};

const normalizeItem = (item) => {
  return {
    ...item,
    stock: parseInt(item.stock || 0),
    price: parseFloat(item.price || 0),
    incompletePairs: parseInt(item.incompletePairs || 0),
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    colors: Array.isArray(item.colors) ? item.colors : [],
    notes: item.notes || ''
  };
};

export const initializeInventory = async () => {
  // No initialization needed for Firestore
};

export const getInventoryItems = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, INVENTORY_COLLECTION));
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(isValidItem)
      .map(normalizeItem);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

export const addInventoryItem = async (item) => {
  try {
    if (!isValidItem(item)) {
      throw new Error('Invalid item data');
    }

    const timestamp = new Date();
    const normalizedItem = normalizeItem(item);
    const newItem = {
      ...normalizedItem,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      date: timestamp.toLocaleDateString(),
      time: timestamp.toLocaleTimeString()
    };
    
    const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), newItem);
    return { id: docRef.id, ...newItem };
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

export const updateInventoryItem = async (updatedItem) => {
  try {
    const { id, ...itemData } = updatedItem;
    
    if (!id || !isValidItem(itemData)) {
      throw new Error('Invalid item data or missing ID');
    }

    const timestamp = new Date();
    const normalizedItem = normalizeItem(itemData);
    const updatedData = {
      ...normalizedItem,
      updatedAt: timestamp.toISOString(),
      date: timestamp.toLocaleDateString(),
      time: timestamp.toLocaleTimeString()
    };
    
    const docRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
    if (!itemId) {
      throw new Error('Invalid item ID');
    }

    const docRef = doc(db, INVENTORY_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

export const filterInventory = async (storeId, searchTerm) => {
  try {
    let q = collection(db, INVENTORY_COLLECTION);
    
    if (storeId && storeId !== 'all') {
      q = query(q, where('storeId', '==', storeId));
    }
    
    const querySnapshot = await getDocs(q);
    let items = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(isValidItem)  // Filter out invalid items
      .map(normalizeItem); // Normalize data types

    if (searchTerm) {
      const searchParams = searchTerm.toLowerCase().split('+');
      items = items.filter(item => {
        return searchParams.every(param => {
          const paramTrimmed = param.trim();
          if (!paramTrimmed) return true;
          
          return (
            item.atNo?.toLowerCase().includes(paramTrimmed) ||
            item.name?.toLowerCase().includes(paramTrimmed) ||
            item.brand?.toLowerCase().includes(paramTrimmed) ||
            item.category?.toLowerCase().includes(paramTrimmed) ||
            item.sizes.some(size => size.toString().includes(paramTrimmed)) ||
            item.colors.some(color => color.toLowerCase().includes(paramTrimmed)) ||
            item.date?.includes(paramTrimmed) ||
            item.time?.includes(paramTrimmed) ||
            item.gender?.toLowerCase().includes(paramTrimmed) ||
            item.ageGroup?.toLowerCase().includes(paramTrimmed)
          );
        });
      });
    }
    
    return items;
  } catch (error) {
    console.error('Error filtering inventory:', error);
    return [];
  }
};