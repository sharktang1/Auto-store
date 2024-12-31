// src/utils/admin-inventory.js

export const initializeInventory = () => {
  const inventory = localStorage.getItem('admin-inventory');
  if (!inventory) {
    localStorage.setItem('admin-inventory', JSON.stringify([]));
  }
};

export const getInventoryItems = () => {
  const inventory = localStorage.getItem('admin-inventory');
  return inventory ? JSON.parse(inventory) : [];
};

export const addInventoryItem = (item) => {
  const inventory = getInventoryItems();
  const timestamp = new Date();
  const newItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
    date: timestamp.toLocaleDateString(),
    time: timestamp.toLocaleTimeString()
  };
  inventory.push(newItem);
  localStorage.setItem('admin-inventory', JSON.stringify(inventory));
  return newItem;
};

export const updateInventoryItem = (updatedItem) => {
  const inventory = getInventoryItems();
  const index = inventory.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    const timestamp = new Date();
    inventory[index] = {
      ...updatedItem,
      updatedAt: timestamp.toISOString(),
      date: timestamp.toLocaleDateString(),
      time: timestamp.toLocaleTimeString()
    };
    localStorage.setItem('admin-inventory', JSON.stringify(inventory));
    return inventory[index];
  }
  return null;
};

export const deleteInventoryItem = (itemId) => {
  const inventory = getInventoryItems();
  const filteredInventory = inventory.filter(item => item.id !== itemId);
  localStorage.setItem('admin-inventory', JSON.stringify(filteredInventory));
};

export const filterInventory = (items, storeId, searchTerm) => {
  return items.filter(item => {
    if (storeId !== 'all' && item.storeId !== storeId) {
      return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.sizes.some(size => size.toString().includes(searchTerm)) ||
        item.colors.some(color => color.toLowerCase().includes(searchLower)) ||
        item.date?.includes(searchTerm) ||
        item.time?.includes(searchTerm)
      );
    }
    return true;
  });
};