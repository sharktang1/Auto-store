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

// Updated filterInventory function with more precise matching
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
      .filter(isValidItem)
      .map(normalizeItem);

    if (searchTerm) {
      const searchParams = searchTerm.toLowerCase().split('+').map(param => param.trim()).filter(param => param);
      
      items = items.filter(item => {
        return searchParams.every(param => {
          // Helper function to check exact number matches
          const isExactNumberMatch = (value, searchValue) => {
            const numericSearch = parseFloat(searchValue);
            return !isNaN(numericSearch) && value === numericSearch;
          };

          // Helper function to check exact size matches
          const isExactSizeMatch = (sizes, searchValue) => {
            const numericSearch = parseFloat(searchValue);
            return sizes.some(size => {
              const numericSize = parseFloat(size);
              return !isNaN(numericSearch) && !isNaN(numericSize) && numericSize === numericSearch;
            });
          };

          // Check for exact matches in different fields
          return (
            // Exact match for @No
            (item.atNo?.toLowerCase() === param) ||
            // Exact match for size
            (isExactSizeMatch(item.sizes, param)) ||
            // Exact match for color
            (item.colors.some(color => color.toLowerCase() === param)) ||
            // Partial matches for text fields
            (item.name?.toLowerCase().includes(param)) ||
            (item.brand?.toLowerCase().includes(param)) ||
            (item.category?.toLowerCase().includes(param)) ||
            (item.date?.includes(param)) ||
            (item.time?.includes(param)) ||
            (item.gender?.toLowerCase() === param) ||
            (item.ageGroup?.toLowerCase() === param)
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