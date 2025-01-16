import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { addInventoryItem, updateInventoryItem } from '../../utils/admin-inventory';

const UpdateInventory = ({ item, onClose, isDarkMode, selectedStore, onInventoryUpdate }) => {
  const [formData, setFormData] = useState({
    atNo: '',
    name: '',
    brand: '',
    category: '',
    sizes: '',
    colors: '',
    price: '',
    stock: 0,
    incompletePairs: 0,
    notes: '',
    ageGroup: '',
    gender: '',
    storeId: selectedStore
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStockHelp, setShowStockHelp] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        sizes: Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes,
        colors: Array.isArray(item.colors) ? item.colors.join(', ') : item.colors,
        incompletePairs: item.incompletePairs || 0,
        notes: item.notes || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        atNo: '',
        storeId: selectedStore,
        sizes: '',
        colors: '',
        stock: 0,
        incompletePairs: 0,
        notes: '',
        price: ''
      }));
    }
  }, [item, selectedStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sizes.trim()) {
      setError('Please enter at least one size');
      return;
    }

    if (parseInt(formData.incompletePairs) > parseInt(formData.stock)) {
      setError('Incomplete pairs cannot exceed total stock');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const processedData = {
        ...formData,
        sizes: formData.sizes.split(',').map(size => size.trim()).filter(size => size),
        colors: formData.colors.split(',').map(color => color.trim()).filter(color => color),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        incompletePairs: parseInt(formData.incompletePairs),
        storeId: selectedStore === 'all' ? null : selectedStore
      };

      if (item) {
        await updateInventoryItem(processedData);
      } else {
        await addInventoryItem(processedData);
      }

      if (onInventoryUpdate) await onInventoryUpdate();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalShoes = () => {
    const completePairs = parseInt(formData.stock) - parseInt(formData.incompletePairs);
    return (completePairs * 2) + parseInt(formData.incompletePairs);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {item ? 'Update Item' : 'Add New Item'}
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={20} className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              @No
            </label>
            <input
              type="text"
              value={formData.atNo}
              onChange={(e) => setFormData({ ...formData, atNo: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              pattern="[A-Za-z0-9]+"  // Only allow alphanumeric characters
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            >
              <option value="">Select Category</option>
              <option value="Running">Running</option>
              <option value="Training">Training</option>
              <option value="Casual">Casual</option>
              <option value="Sport">Sport</option>
              <option value="Fashion">Fashion</option>
            </select>
          </div>

          <div className="relative">
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                Total Pairs in Stock
                <HelpCircle
                  size={16}
                  className="cursor-help text-gray-400"
                  onMouseEnter={() => setShowStockHelp(true)}
                  onMouseLeave={() => setShowStockHelp(false)}
                />
              </div>
            </label>
            {showStockHelp && (
              <div className={`absolute z-10 right-0 w-64 p-3 rounded-lg shadow-lg ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
              }`}>
                Total pairs represents all pairs in stock, including both complete and incomplete pairs.
              </div>
            )}
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              min="0"
              disabled={loading}
            />
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total number of pairs, both complete and incomplete
            </p>
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Incomplete Pairs
            </label>
            <input
              type="number"
              value={formData.incompletePairs}
              onChange={(e) => setFormData({ ...formData, incompletePairs: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              min="0"
              max={formData.stock}
              disabled={loading}
            />
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Number of pairs missing one shoe (cannot exceed total stock)
            </p>
          </div>

          <div className="md:col-span-2">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-blue-800'}`}>
                Stock Summary
              </h3>
              <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-blue-800'} space-y-1`}>
                <p>• Total pairs in stock: {formData.stock}</p>
                <p>• Complete pairs: {formData.stock - formData.incompletePairs} 
                   ({(formData.stock - formData.incompletePairs) * 2} shoes)</p>
                <p>• Incomplete pairs: {formData.incompletePairs} 
                   ({formData.incompletePairs} individual shoes)</p>
                <p>• Total individual shoes in stock: {calculateTotalShoes()}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Sizes (comma-separated)
            </label>
            <input
              type="text"
              value={formData.sizes}
              onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
              placeholder="e.g., 7, 8, 9.5, 10"
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Colors (comma-separated)
            </label>
            <input
              type="text"
              value={formData.colors}
              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
              placeholder="e.g., Black, White, Red"
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Price ($)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Age Group
            </label>
            <select
              value={formData.ageGroup}
              onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            >
              <option value="">Select Age Group</option>
              <option value="Kids">Kids</option>
              <option value="Teens">Teens</option>
              <option value="Adult">Adult</option>
            </select>
          </div>

          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
              disabled={loading}
            >
              <option value="">Select Gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
        </div>

        <div>
          <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Notes About Incomplete Pairs
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={`w-full p-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
            rows="3"
            placeholder="Specify which shoes are missing (e.g., 'Size 9 missing left shoe', 'Size 10 missing right shoe')"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default UpdateInventory;