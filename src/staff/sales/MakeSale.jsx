// MakeSale.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, ShoppingCart } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const MakeSale = ({ storeData, userId, onClose, onSaleComplete, isDarkMode }) => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleData, setSaleData] = useState({
    productName: '',
    brand: '',
    size: '',
    quantity: 1,
    price: 0,
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash'
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showInventoryList, setShowInventoryList] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!storeData?.id) {
        console.error('Missing required store information');
        toast.error('Error: Store information not found');
        setLoading(false);
        return;
      }

      try {
        const inventoryRef = collection(db, 'inventory');
        const inventoryQuery = query(inventoryRef, where('storeId', '==', storeData.id));
        const snapshot = await getDocs(inventoryQuery);
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Error loading inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [storeData]);

  useEffect(() => {
    if (inventory.length > 0 && searchTerm) {
      const filtered = inventory.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(searchStr) ||
          item.brand?.toLowerCase().includes(searchStr) ||
          item.category?.toLowerCase().includes(searchStr)
        );
      });
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventory);
    }
  }, [inventory, searchTerm]);

  const handleProductSelect = (product) => {
    if (!product) {
      toast.error('Invalid product selected');
      return;
    }

    setSelectedProduct(product);
    setSaleData(prev => ({
      ...prev,
      productName: product.name || '',
      brand: product.brand || '',
      price: product.price || 0,
      size: ''
    }));
    setShowInventoryList(false);
  };

  const validateSaleData = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return false;
    }

    if (!saleData.size) {
      toast.error('Please select a size');
      return false;
    }

    if (!saleData.quantity || saleData.quantity < 1) {
      toast.error('Please enter a valid quantity');
      return false;
    }

    if (saleData.quantity > selectedProduct.stock) {
      toast.error(`Insufficient stock. Only ${selectedProduct.stock} units available`);
      return false;
    }

    if (!saleData.paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!storeData?.id || !userId) {
      toast.error('Missing required store or user information');
      return;
    }

    if (!validateSaleData()) {
      return;
    }

    setProcessing(true);

    try {
      // Create sale record
      const saleRecord = {
        ...saleData,
        productId: selectedProduct.id,
        storeId: storeData.id,
        storeLocation: storeData.location,
        storeNumber: storeData.storeNumber,
        userId,
        timestamp: serverTimestamp(),
        total: saleData.price * saleData.quantity
      };

      // Add sale to database
      const saleRef = await addDoc(collection(db, 'sales'), saleRecord);

      // Update inventory stock
      const productRef = doc(db, 'inventory', selectedProduct.id);
      const newStock = selectedProduct.stock - saleData.quantity;
      await updateDoc(productRef, { stock: newStock });

      toast.success('Sale completed successfully');
      onSaleComplete();
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error processing sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          isDarkMode ? 'border-white' : 'border-blue-500'
        }`} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Record New Sale
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={20} className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Search Product
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowInventoryList(true);
              }}
              placeholder="Search by name, brand, or category"
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              }`}
            />
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} size={20} />
          </div>

          {showInventoryList && filteredInventory.length > 0 && (
            <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleProductSelect(item)}
                  className={`p-3 cursor-pointer ${
                    isDarkMode 
                      ? 'hover:bg-gray-600 border-gray-600' 
                      : 'hover:bg-gray-50 border-gray-200'
                  } border-b last:border-b-0`}
                >
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.name}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.brand} - KES {item.price?.toFixed(2)} (Stock: {item.stock})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Size
              </label>
              <select
                value={saleData.size}
                onChange={(e) => setSaleData({ ...saleData, size: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
              >
                <option value="">Select Size</option>
                {selectedProduct.sizes?.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={saleData.quantity}
                onChange={(e) => setSaleData({ ...saleData, quantity: parseInt(e.target.value) || 0 })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={saleData.customerName}
                onChange={(e) => setSaleData({ ...saleData, customerName: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                value={saleData.customerPhone}
                onChange={(e) => setSaleData({ ...saleData, customerPhone: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Payment Method
              </label>
              <select
                value={saleData.paymentMethod}
                onChange={(e) => setSaleData({ ...saleData, paymentMethod: e.target.value })}
                className={`w-full p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className={`w-full p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Amount
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  KES {(saleData.price * saleData.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={processing}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`flex items-center px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white ${
              processing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={processing}
          >
            <ShoppingCart size={20} className="mr-2" />
            {processing ? 'Processing...' : 'Complete Sale'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default MakeSale;