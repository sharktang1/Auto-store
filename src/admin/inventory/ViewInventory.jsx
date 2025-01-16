import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, AlertCircle, Info } from 'lucide-react';
import { filterInventory, deleteInventoryItem } from '../../utils/admin-inventory';

const ViewInventory = ({ onEditItem, isDarkMode, selectedStore, onInventoryUpdate }) => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStockInfo, setShowStockInfo] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const filtered = await filterInventory(selectedStore, searchTerm);
        const processedInventory = filtered.map(item => ({
          ...item,
          sizes: Array.isArray(item.sizes) ? item.sizes : (item.sizes || '').split(',').map(s => s.trim()).filter(Boolean),
          colors: Array.isArray(item.colors) ? item.colors : (item.colors || '').split(',').map(c => c.trim()).filter(Boolean),
          incompletePairs: item.incompletePairs || 0,
          notes: item.notes || ''
        }));
        setInventory(processedInventory);
        setError(null);
      } catch (err) {
        setError('Failed to load inventory');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [selectedStore, searchTerm]);

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(itemId);
        const updatedInventory = await filterInventory(selectedStore, searchTerm);
        setInventory(updatedInventory);
        if (onInventoryUpdate) onInventoryUpdate();
      } catch (err) {
        setError('Failed to delete item');
        console.error(err);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const calculateTotalShoes = (item) => {
    const completePairs = item.stock - item.incompletePairs;
    return (completePairs * 2) + parseInt(item.incompletePairs);
  };

  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by name, brand, category..."
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

        <div 
          className="relative" 
          onMouseEnter={() => setShowStockInfo(true)}
          onMouseLeave={() => setShowStockInfo(false)}
        >
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Info size={20} />
            Stock Info
          </button>
          {showStockInfo && (
            <div className={`absolute right-0 mt-2 p-4 rounded-lg shadow-lg z-10 w-80 ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
            }`}>
              <h4 className="font-semibold mb-2">Understanding Stock Numbers:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Total Pairs: All pairs in inventory (complete + incomplete)</li>
                <li>• Complete Pairs: Pairs with both left and right shoes</li>
                <li>• Incomplete Pairs: Pairs missing one shoe</li>
                <li>• Total Shoes: Complete pairs × 2 + Incomplete pairs</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-12 w-full rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                <th className="p-3 text-left">@No</th>  
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Total Pairs</th>
                <th className="p-3 text-right">Complete</th>
                <th className="p-3 text-right">Incomplete</th>
                <th className="p-3 text-center">Total Shoes</th>
                <th className="p-3 text-center">Sizes</th>
                <th className="p-3 text-center">Colors</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center p-4">
                    No items found
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-t ${
                      isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <td className="p-3">{item.atNo}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {item.name}
                        {item.incompletePairs > 0 && (
                          <AlertCircle
                            size={16}
                            className="ml-2 text-amber-500"
                            title={`${item.incompletePairs} pairs missing one shoe`}
                          />
                        )}
                      </div>
                      {item.notes && (
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{item.brand}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 text-right">${item.price}</td>
                    <td className="p-3 text-right">{item.stock}</td>
                    <td className="p-3 text-right">{item.stock - item.incompletePairs}</td>
                    <td className="p-3 text-right">
                      {item.incompletePairs > 0 ? (
                        <span className="text-amber-500">{item.incompletePairs}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-3 text-center">{calculateTotalShoes(item)}</td>
                    <td className="p-3 text-center">{item.sizes.join(', ')}</td>
                    <td className="p-3 text-center">{item.colors.join(', ')}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEditItem(item)}
                          className="p-1 text-blue-500 hover:text-blue-600"
                          title="Edit item"
                        >
                          <Edit size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-500 hover:text-red-600"
                          title="Delete item"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewInventory;