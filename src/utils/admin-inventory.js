// src/utils/admin-inventory.js

// Initialize inventory in localStorage if it doesn't exist
export const initializeInventory = () => {
    const inventory = localStorage.getItem('admin-inventory');
    if (!inventory) {
      localStorage.setItem('admin-inventory', JSON.stringify([]));
    }
  };
  
  // Get all inventory items
  export const getInventoryItems = () => {
    const inventory = localStorage.getItem('admin-inventory');
    return inventory ? JSON.parse(inventory) : [];
  };
  
  // Add new inventory item
  export const addInventoryItem = (item) => {
    const inventory = getInventoryItems();
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inventory.push(newItem);
    localStorage.setItem('admin-inventory', JSON.stringify(inventory));
    return newItem;
  };
  
  // Update existing inventory item
  export const updateInventoryItem = (updatedItem) => {
    const inventory = getInventoryItems();
    const index = inventory.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      inventory[index] = {
        ...updatedItem,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('admin-inventory', JSON.stringify(inventory));
      return inventory[index];
    }
    return null;
  };
  
  // Delete inventory item
  export const deleteInventoryItem = (itemId) => {
    const inventory = getInventoryItems();
    const filteredInventory = inventory.filter(item => item.id !== itemId);
    localStorage.setItem('admin-inventory', JSON.stringify(filteredInventory));
  };
  
  // Filter inventory by store and search term
  export const filterInventory = (items, storeId, searchTerm) => {
    return items.filter(item => {
      // Store filter
      if (storeId !== 'all' && item.storeId !== storeId) {
        return false;
      }
  
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.sizes.some(size => size.toString().includes(searchTerm)) ||
          item.colors.some(color => color.toLowerCase().includes(searchLower))
        );
      }
  
      return true;
    });
  };