import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, AlertCircle, Info, Download } from 'lucide-react';
import { filterInventory, deleteInventoryItem } from '../../utils/admin-inventory';

const ViewInventory = ({ onEditItem, isDarkMode, selectedStore, onInventoryUpdate }) => {
  const [inventory, setInventory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStockInfo, setShowStockInfo] = useState(false);

  // Helper function to validate date
  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const currentDate = new Date();
    return date instanceof Date && !isNaN(date) && date <= currentDate;
  };

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (value.trim()) {
      try {
        setLoading(true);
        const filtered = await filterInventory(selectedStore, value);
        
        // Filter out items with invalid dates
        const validItems = filtered.filter(item => {
          // Check if createdAt is valid
          const isDateValid = isValidDate(item.createdAt);
          
          // Log invalid dates for debugging
          if (!isDateValid) {
            console.warn(`Invalid date found for item ${item.atNo}:`, item.createdAt);
          }
          
          return isDateValid;
        });

        setInventory(validItems);
        setError(null);
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError('Failed to load inventory. Please try refreshing the page.');
        setInventory([]);
      } finally {
        setLoading(false);
      }
    } else {
      setInventory([]);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isValidDate(dateString)) {
        return date.toLocaleDateString();
      }
      return 'Invalid Date';
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Rest of the component remains the same...
  const handleDelete = async (itemId) => {
    if (!itemId) {
      setError('Cannot delete item: Invalid item ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(itemId);
        setInventory(prev => prev.filter(item => item.id !== itemId));
        if (onInventoryUpdate) onInventoryUpdate();
      } catch (err) {
        console.error('Error deleting item:', err);
        setError('Failed to delete item. Please try again.');
      }
    }
  };

  const calculateTotalShoes = (item) => {
    const completePairs = item.stock - (item.incompletePairs || 0);
    return (completePairs * 2) + parseInt(item.incompletePairs || 0);
  };

  const exportToCSV = () => {
    try {
      const headers = [
        '@No',
        'Product Name',
        'Brand',
        'Category',
        'Price',
        'Total Pairs',
        'Complete Pairs',
        'Incomplete Pairs',
        'Total Shoes',
        'Sizes',
        'Colors',
        'Age Group',
        'Gender',
        'Notes',
        'Date Added'
      ];

      // Only export items with valid dates
      const validInventory = inventory.filter(item => isValidDate(item.createdAt));

      const csvData = validInventory.map(item => [
        item.atNo,
        item.name,
        item.brand,
        item.category,
        item.price,
        item.stock,
        item.stock - (item.incompletePairs || 0),
        item.incompletePairs || 0,
        calculateTotalShoes(item),
        Array.isArray(item.sizes) ? item.sizes.join(', ') : '',
        Array.isArray(item.colors) ? item.colors.join(', ') : '',
        item.ageGroup || '',
        item.gender || '',
        item.notes || '',
        formatDate(item.createdAt)
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = URL.createObjectURL(blob);
      link.download = `inventory_snapshot_${date}.csv`;
      link.click();
    } catch (err) {
      setError('Failed to export inventory');
      console.error(err);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-12 w-full rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`} />
          ))}
        </div>
      );
    }

    if (!searchInput.trim()) {
      return (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Enter search terms to find inventory items
        </div>
      );
    }

    return (
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
              <th className="p-3 text-center">Date Added</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center p-4">
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
                  <td className="p-3 text-right">{item.stock - (item.incompletePairs || 0)}</td>
                  <td className="p-3 text-right">
                    {item.incompletePairs > 0 ? (
                      <span className="text-amber-500">{item.incompletePairs}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="p-3 text-center">{calculateTotalShoes(item)}</td>
                  <td className="p-3 text-center">{Array.isArray(item.sizes) ? item.sizes.join(', ') : ''}</td>
                  <td className="p-3 text-center">{Array.isArray(item.colors) ? item.colors.join(', ') : ''}</td>
                  <td className="p-3 text-center">{formatDate(item.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEditItem({
                          ...item,
                          date: isValidDate(item.createdAt) ? 
                            new Date(item.createdAt).toISOString().split('T')[0] : 
                            new Date().toISOString().split('T')[0]
                        })}
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
    );
  };


  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by multiple parameters using + (e.g., @123 + red + 9.5)"
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              value={searchInput}
              onChange={handleSearchInput}
            />
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Use + to combine search parameters (e.g., @No + Color + Size)
          </p>
        </div>
        
        <div className="flex gap-4">
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
            } hover:opacity-90`}
          >
            <Download size={20} />
            Export CSV
          </motion.button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default ViewInventory;