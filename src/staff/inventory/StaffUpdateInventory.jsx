import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const StaffUpdateInventory = ({ item, onClose, isDarkMode, selectedStore, onInventoryUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    sizes: [],
    colors: '',
    price: '',
    stock: 0,
    ageGroup: '',
    gender: '',
    storeId: selectedStore,
    lastUpdated: serverTimestamp(),
    updatedBy: '',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const staffSetup = JSON.parse(localStorage.getItem('staffSetup') || '{}');
    
    if (item) {
      setFormData({
        ...item,
        colors: Array.isArray(item.colors) ? item.colors.join(', ') : item.colors,
        updatedBy: user.email || 'unknown',
        lastUpdated: serverTimestamp(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        storeId: selectedStore
      });
    } else {
      setFormData(prev => ({
        ...prev,
        storeId: selectedStore,
        updatedBy: user.email || 'unknown',
        lastUpdated: serverTimestamp(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      }));
    }
  }, [item, selectedStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sizes.length) {
      toast.error('Please select at least one size');
      return;
    }

    setLoading(true);

    try {
      const processedData = {
        ...formData,
        colors: formData.colors.split(',').map(color => color.trim()).filter(color => color),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        storeId: selectedStore,
        lastUpdated: serverTimestamp(),
        createdAt: item ? item.createdAt : serverTimestamp()
      };

      if (item) {
        // Update existing item
        await setDoc(doc(db, 'inventory', item.id), processedData);
        toast.success('Item updated successfully');
      } else {
        // Add new item
        await addDoc(collection(db, 'inventory'), processedData);
        toast.success('Item added successfully');
      }

      if (onInventoryUpdate) onInventoryUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Error updating inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {item ? 'Update Item' : 'Add New Item'}
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X size={20} className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
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
            />
          </div>

          {/* Brand */}
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
            />
          </div>

          {/* Category */}
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
            >
              <option value="">Select Category</option>
              <option value="Running">Running</option>
              <option value="Training">Training</option>
              <option value="Casual">Casual</option>
              <option value="Sport">Sport</option>
              <option value="Fashion">Fashion</option>
            </select>
          </div>

          {/* Colors */}
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
            />
          </div>

          {/* Price */}
          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Price (KES)
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
            />
          </div>

          {/* Stock */}
          <div>
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Stock
            </label>
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
            />
          </div>

          {/* Age Group */}
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
            >
              <option value="">Select Age Group</option>
              <option value="Kids">Kids</option>
              <option value="Teens">Teens</option>
              <option value="Adult">Adult</option>
            </select>
          </div>

          {/* Gender */}
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
            >
              <option value="">Select Gender</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Available Sizes
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12].map((size) => (
              <label
                key={size}
                className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.sizes.includes(size)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.sizes.includes(size)}
                  onChange={(e) => {
                    const newSizes = e.target.checked
                      ? [...formData.sizes, size].sort((a, b) => a - b)
                      : formData.sizes.filter((s) => s !== size);
                    setFormData({ ...formData, sizes: newSizes });
                  }}
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            disabled={loading}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Processing...' : item ? 'Update Item' : 'Add Item'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default StaffUpdateInventory;