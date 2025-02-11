import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ClipboardPaste } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

// Firebase operations
const updateInventoryItem = async (data) => {
  if (!data.id) {
    throw new Error('Item ID is required for update');
  }
  
  const itemRef = doc(db, 'inventory', data.id);
  
  // Create a clean update object without undefined values
  const updateData = {
    atNo: data.atNo,
    name: data.name,
    brand: data.brand,
    category: data.category,
    sizes: data.sizes,
    colors: data.colors,
    price: data.price,
    stock: data.stock,
    incompletePairs: data.incompletePairs,
    notes: data.notes,
    ageGroup: data.ageGroup,
    gender: data.gender,
    storeId: data.storeId,
    date: data.date
  };

  // Remove any undefined or null values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined || updateData[key] === null) {
      delete updateData[key];
    }
  });
  
  await updateDoc(itemRef, updateData);
};

const addInventoryItem = async (data) => {
  const inventoryRef = collection(db, 'inventory');
  await addDoc(inventoryRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
};

const UpdateInventory = ({ 
  item, 
  onClose, 
  isDarkMode, 
  selectedStore, 
  onInventoryUpdate,
  copiedItemData 
}) => {
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
    storeId: selectedStore,
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStockHelp, setShowStockHelp] = useState(false);

  useEffect(() => {
    if (selectedStore === 'all') {
      setError('Please select a specific store to add or update inventory items');
      return;
    }

    if (copiedItemData) {
      setFormData({
        ...copiedItemData,
        storeId: selectedStore
      });
    } else if (item) {
      setFormData({
        ...item,
        date: item.date || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        sizes: Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes,
        colors: Array.isArray(item.colors) ? item.colors.join(', ') : item.colors,
        incompletePairs: item.incompletePairs || 0,
        notes: item.notes || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        storeId: selectedStore
      }));
    }
  }, [item, selectedStore, copiedItemData]);

  const fetchLentItems = async () => {
    try {
      const lentQuery = query(
        collection(db, 'lentshoes'),
        where('status', '!=', 'updated')
      );
      
      const snapshot = await getDocs(lentQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching lent items:', error);
      toast.error('Failed to fetch lent items');
      return [];
    }
  };

  const handlePasteFromLent = async () => {
    try {
      const lentItems = await fetchLentItems();
      
      if (!lentItems || lentItems.length === 0) {
        toast.info('No lent items available to paste');
        return;
      }

      if (lentItems.length === 1) {
        pasteItemData(lentItems[0]);
      } else {
        const selectedItem = await showItemSelectionModal(lentItems);
        if (selectedItem) {
          pasteItemData(selectedItem);
        }
      }
    } catch (error) {
      console.error('Error handling paste:', error);
      toast.error('Failed to paste item data');
    }
  };

  const showItemSelectionModal = (items) => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = `fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`;

      const content = document.createElement('div');
      content.className = `w-full max-w-md p-6 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`;
      
      content.innerHTML = `
        <h3 class="text-lg font-medium mb-4">Select Item to Paste</h3>
        <div class="space-y-2">
          ${items.map((item, index) => `
            <button
              data-index="${index}"
              class="w-full text-left p-3 rounded-lg ${
                isDarkMode 
                  ? 'hover:bg-gray-700 focus:bg-gray-700' 
                  : 'hover:bg-gray-100 focus:bg-gray-100'
              }"
            >
              ${item.itemDetails.name} - ${item.itemDetails.brand}
              <div class="text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
                From: ${item.fromStoreId} | Quantity: ${item.quantity}
              </div>
            </button>
          `).join('')}
        </div>
        <button
          id="cancelSelect"
          class="mt-4 px-4 py-2 rounded-lg ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }"
        >
          Cancel
        </button>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      content.querySelectorAll('button:not(#cancelSelect)').forEach(button => {
        button.addEventListener('click', () => {
          const selectedItem = items[parseInt(button.dataset.index)];
          document.body.removeChild(modal);
          resolve(selectedItem);
        });
      });

      document.getElementById('cancelSelect').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
    });
  };

  const pasteItemData = (lentItem) => {
    const itemDetails = lentItem.itemDetails;
    
    setFormData({
      ...formData,
      atNo: itemDetails.atNo || '',
      name: itemDetails.name || '',
      brand: itemDetails.brand || '',
      category: itemDetails.category || '',
      sizes: Array.isArray(itemDetails.sizes) 
        ? itemDetails.sizes.join(', ') 
        : itemDetails.sizes || '',
      colors: Array.isArray(itemDetails.colors) 
        ? itemDetails.colors.join(', ') 
        : itemDetails.colors || '',
      price: itemDetails.price || '',
      stock: parseInt(lentItem.quantity) || 0,
      incompletePairs: 0,
      notes: `Lent from ${lentItem.fromStoreId} on ${new Date(lentItem.lentDate).toLocaleDateString()}`,
      ageGroup: itemDetails.ageGroup || '',
      gender: itemDetails.gender || '',
      storeId: selectedStore
    });

    toast.success('Item details pasted successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStore === 'all') {
      setError('Please select a specific store to add or update inventory items');
      return;
    }

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
        storeId: selectedStore,
        date: formData.date
      };

      if (item) {
        // Add the id for update operations
        processedData.id = item.id;
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

      {selectedStore === 'all' ? (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Please select a specific store from the dropdown menu to add or update inventory items.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-end">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePasteFromLent}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <ClipboardPaste size={16} />
              <span>Paste from Lent Items</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                pattern="[A-Za-z0-9]+"
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
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
                disabled={loading}
                placeholder="Enter category"
              />
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
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
                disabled={loading}
                placeholder="e.g., 7, 8, 9.5, 10"
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
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
                disabled={loading}
                placeholder="e.g., Black, White, Red"
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

            <div className="md:col-span-2">
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Notes
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
                placeholder="Add any additional notes about the item"
                disabled={loading}
              />
            </div>
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
      )}
    </motion.div>
  );
};

export default UpdateInventory;