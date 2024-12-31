import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Edit, Trash2 } from 'lucide-react';
import { getInventoryItems, filterInventory, deleteInventoryItem } from '../../utils/admin-inventory';

const ViewInventory = ({ onEditItem, isDarkMode, selectedStore, onInventoryUpdate }) => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);

  // Load inventory from localStorage
  useEffect(() => {
    const items = getInventoryItems();
    setInventory(items);
  }, []);

  // Update filtered inventory when inventory, search term, or selected store changes
  useEffect(() => {
    const filtered = filterInventory(inventory, selectedStore, searchTerm);
    setFilteredInventory(filtered);
  }, [inventory, selectedStore, searchTerm]);

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteInventoryItem(itemId);
      setInventory(getInventoryItems());
      if (onInventoryUpdate) onInventoryUpdate();
    }
  };

  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by name, size, color..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-center">Sizes</th>
              <th className="p-3 text-center">Colors</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-t ${
                  isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                }`}
              >
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.brand}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3 text-right">${item.price}</td>
                <td className="p-3 text-right">{item.stock}</td>
                <td className="p-3 text-center">{item.sizes.join(', ')}</td>
                <td className="p-3 text-center">{item.colors.join(', ')}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEditItem(item)}
                      className="p-1 text-blue-500 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewInventory;