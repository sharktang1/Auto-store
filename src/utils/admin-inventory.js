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

export const initializeInventory = async () => {
  // No initialization needed for Firestore
};

export const getInventoryItems = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, INVENTORY_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

export const addInventoryItem = async (item) => {
  try {
    const timestamp = new Date();
    const newItem = {
      ...item,
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
    const timestamp = new Date();
    const updatedData = {
      ...itemData,
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
    
    if (storeId !== 'all') {
      q = query(q, where('storeId', '==', storeId));
    }
    
    const querySnapshot = await getDocs(q);
    let items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item => (
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.sizes.some(size => size.toString().includes(searchTerm)) ||
        item.colors.some(color => color.toLowerCase().includes(searchLower)) ||
        item.date?.includes(searchTerm) ||
        item.time?.includes(searchTerm)
      ));
    }
    
    return items;
  } catch (error) {
    console.error('Error filtering inventory:', error);
    return [];
  }
};