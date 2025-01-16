import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingCart } from 'lucide-react';
import { collection, getDocs, query, where, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const MakeSalePage = ({ storeData, userId, userRole, onClose, onSaleComplete, isDarkMode }) => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchParams, setSearchParams] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showInventoryList, setShowInventoryList] = useState(false);
  const [saleData, setSaleData] = useState({
    productName: '',
    brand: '',
    size: '',
    quantity: 1,
    price: 0,
    originalPrice: 0,
    isHaggled: false,
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    const fetchInventory = async () => {
      if (!storeData?.id || !userId || !['staff', 'staff-admin'].includes(userRole)) {
        toast.error('Error: Missing information or unauthorized access');
        setLoading(false);
        return;
      }

      try {
        const inventoryRef = collection(db, 'inventory');
        const inventoryQuery = query(inventoryRef, where('storeId', '==', storeData.id));
        const snapshot = await getDocs(inventoryQuery);
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sizes: Array.isArray(doc.data().sizes) 
            ? doc.data().sizes 
            : (doc.data().sizes || '').split(',').map(s => s.trim()).filter(Boolean),
          colors: Array.isArray(doc.data().colors) 
            ? doc.data().colors 
            : (doc.data().colors || '').split(',').map(c => c.trim()).filter(Boolean)
        }));
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Error loading inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [storeData, userId, userRole]);

  useEffect(() => {
    if (inventory.length > 0 && searchParams.length > 0) {
      const filtered = inventory.filter(item => {
        return searchParams.every(param => {
          const paramLower = param.toLowerCase().trim();
          return (
            item.atNo?.toLowerCase().includes(paramLower) ||
            item.name?.toLowerCase().includes(paramLower) ||
            item.brand?.toLowerCase().includes(paramLower) ||
            item.category?.toLowerCase().includes(paramLower) ||
            item.colors?.some(color => color.toLowerCase().includes(paramLower)) ||
            item.sizes?.some(size => size.toString().includes(paramLower)) ||
            item.gender?.toLowerCase().includes(paramLower) ||
            item.ageGroup?.toLowerCase().includes(paramLower)
          );
        });
      });
      
      setFilteredInventory(filtered);
      setShowInventoryList(filtered.length > 0);
    } else {
      setFilteredInventory([]);
      setShowInventoryList(false);
    }
  }, [inventory, searchParams]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    const params = value.split('+').map(param => param.trim()).filter(param => param.length > 0);
    setSearchParams(params);
  };

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
      originalPrice: product.price || 0,
      isHaggled: false,
      size: ''
    }));
    setShowInventoryList(false);
    setSearchInput('');
    setSearchParams([]);
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setSaleData(prev => ({
      ...prev,
      price: newPrice,
      isHaggled: newPrice !== prev.originalPrice
    }));
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
    if (!saleData.price || saleData.price <= 0) {
      toast.error('Please enter a valid price');
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

    if (!storeData?.id || !userId || !['staff', 'staff-admin'].includes(userRole)) {
      toast.error('Missing required information or unauthorized');
      return;
    }

    if (!validateSaleData()) return;

    setProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'inventory', selectedProduct.id);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }

        const productData = productDoc.data();
        if (productData.stock < saleData.quantity) {
          throw new Error(`Insufficient stock. Only ${productData.stock} units available`);
        }

        const saleRef = doc(collection(db, 'sales'));
        transaction.set(saleRef, {
          ...saleData,
          productId: selectedProduct.id,
          storeId: storeData.id,
          storeLocation: storeData.location,
          storeNumber: storeData.storeNumber,
          userId,
          timestamp: new Date(),
          total: saleData.price * saleData.quantity,
          originalPrice: saleData.originalPrice,
          priceHaggled: saleData.isHaggled,
          discountAmount: saleData.isHaggled ? saleData.originalPrice - saleData.price : 0,
          discountPercentage: saleData.isHaggled ? 
            ((saleData.originalPrice - saleData.price) / saleData.originalPrice * 100).toFixed(2) : 0
        });

        transaction.update(productRef, {
          stock: productData.stock - saleData.quantity
        });
      });

      toast.success('Sale completed successfully');
      onSaleComplete();
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error(error.message || 'Error processing sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          isDarkMode ? 'border-white' : 'border-blue-500'
        }`} />
      </div>
    );
  }

  const inputClasses = `w-full px-4 py-2 rounded-lg border transition-colors duration-200 ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 placeholder-gray-500'
  }`;

  const buttonClasses = {
    primary: `flex items-center justify-center px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 
      text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`,
    secondary: `px-6 py-2 rounded-lg transition-colors duration-200 ${
      isDarkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-lg shadow-lg ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    } p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          New Sale
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-colors duration-200 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X className={isDarkMode ? 'text-gray-200' : 'text-gray-900'} size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Search Product
          </label>
          <div className="relative">
            <Search 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} 
              size={20} 
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInput}
              placeholder="Search using multiple parameters (e.g., @123 + red + 9.5)"
              className={`${inputClasses} pl-10`}
            />
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Use + to combine search parameters (e.g., @No + Color + Size)
          </p>

          {showInventoryList && filteredInventory.length > 0 && (
            <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleProductSelect(item)}
                  className={`p-4 cursor-pointer ${
                    isDarkMode 
                      ? 'hover:bg-gray-600 border-gray-600' 
                      : 'hover:bg-gray-50 border-gray-200'
                  } border-b last:border-b-0`}
                >
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.atNo} - {item.name}
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.brand} - KES {item.price?.toFixed(2)} (Stock: {item.stock})
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sizes: {item.sizes.join(', ')} | Colors: {item.colors.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Size
              </label>
              <select
                value={saleData.size}
                onChange={(e) => setSaleData({ ...saleData, size: e.target.value })}
                className={inputClasses}
                required
              >
                <option value="">Select Size</option>
                {selectedProduct.sizes?.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={saleData.quantity}
                onChange={(e) => setSaleData({ ...saleData, quantity: parseInt(e.target.value) || 0 })}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Price (KES)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={saleData.price}
                  onChange={handlePriceChange}
                  className={`${inputClasses} ${saleData.isHaggled ? 'border-yellow-500 border-2' : ''}`}
                  required
                />
                {saleData.isHaggled && (
                  <div className={`mt-1 text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    <span>Original: KES {saleData.originalPrice.toFixed(2)}</span>
                    <span className="ml-2">
                      Discount: {((saleData.originalPrice - saleData.price) / saleData.originalPrice * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Payment Method
              </label>
              <select
                value={saleData.paymentMethod}
                onChange={(e) => setSaleData({ ...saleData, paymentMethod: e.target.value })}
                className={inputClasses}
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={saleData.customerName}
                onChange={(e) => setSaleData({ ...saleData, customerName: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                value={saleData.customerPhone}
                onChange={(e) => setSaleData({ ...saleData, customerPhone: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="space-y-2">
                <div className={`flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>Unit Price:</span>
                  <span>KES {saleData.price.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>Quantity:</span>
                  <span>{saleData.quantity}</span>
                </div>
                {saleData.isHaggled && (
                  <div className={`flex justify-between ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    <span>Discount:</span>
                    <span>KES {((saleData.originalPrice - saleData.price) * saleData.quantity).toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between text-lg font-bold pt-2 border-t ${
                  isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
                }`}>
                  <span>Total:</span>
                  <span>KES {(saleData.price * saleData.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className={buttonClasses.secondary}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={buttonClasses.primary}
            disabled={processing}
          >
            <ShoppingCart size={20} className="mr-2" />
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
    );
};

export default MakeSalePage;