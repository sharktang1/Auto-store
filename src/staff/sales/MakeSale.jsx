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
    saleDate: new Date().toISOString().split('T')[0],
    payments: [
      { method: 'cash', amount: 0 },
      { method: 'mpesa', amount: 0 },
      { method: 'card', amount: 0 }
    ]
  });

  // Fetch inventory data
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

  // Filter inventory based on search parameters
  useEffect(() => {
    if (inventory.length > 0 && searchParams.length > 0) {
      const filtered = inventory.filter(item => {
        return searchParams.every(param => {
          const paramLower = param.toLowerCase().trim();
          return (
            item.sizes?.some(size => size.toString().toLowerCase() === paramLower) ||
            item.colors?.some(color => color.toLowerCase() === paramLower) ||
            (/^\d+/.test(paramLower) && item.atNo?.toLowerCase() === paramLower) ||
            item.brand?.toLowerCase() === paramLower ||
            item.name?.toLowerCase() === paramLower ||
            item.category?.toLowerCase() === paramLower ||
            item.gender?.toLowerCase() === paramLower ||
            item.ageGroup?.toLowerCase() === paramLower
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
    setSearchParams(value.split('+').map(param => param.trim()).filter(Boolean));
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

  const calculateTotalPayments = () => {
    return saleData.payments.reduce((total, payment) => total + (parseFloat(payment.amount) || 0), 0);
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

    const totalAmount = saleData.price * saleData.quantity;
    const totalPayments = calculateTotalPayments();
    
    if (Math.abs(totalAmount - totalPayments) > 0.01) {
      toast.error(`Total payments must equal total amount`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateSaleData()) return;
    setProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'inventory', selectedProduct.id);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) throw new Error('Product not found');
        
        const productData = productDoc.data();
        if (productData.stock < saleData.quantity) {
          throw new Error(`Insufficient stock. Only ${productData.stock} units available`);
        }

        const saleRef = doc(collection(db, 'sales'));
        const saleTimestamp = new Date(saleData.saleDate);
        
        transaction.set(saleRef, {
          ...saleData,
          productId: selectedProduct.id,
          storeId: storeData.id,
          storeLocation: storeData.location,
          storeNumber: storeData.storeNumber,
          userId,
          timestamp: saleTimestamp,
          serverTimestamp: new Date(),
          total: saleData.price * saleData.quantity,
          originalPrice: saleData.originalPrice,
          priceHaggled: saleData.isHaggled,
          discountAmount: saleData.isHaggled ? saleData.originalPrice - saleData.price : 0,
          discountPercentage: saleData.isHaggled ? 
            ((saleData.originalPrice - saleData.price) / saleData.originalPrice * 100).toFixed(2) : 0,
          payments: saleData.payments.filter(p => parseFloat(p.amount) > 0)
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
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${
          isDarkMode ? 'border-white' : 'border-blue-500'
        }`} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50">
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className={`w-full max-w-4xl rounded-xl shadow-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-4 md:p-6 relative`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              New Sale
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Section */}
            {/* Search Section */}
            <div className="relative">
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Search Product
              </label>
              <div className="relative">
                <Search 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                  size={20} 
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInput}
                  placeholder="Search using multiple parameters (e.g., @123 + red + 9.5)"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use + to combine search parameters (e.g., @No + Color + Size)
              </p>

              {/* Search Results */}
              {showInventoryList && (
                <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-96 overflow-y-auto ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`}>
                  {filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleProductSelect(item)}
                      className={`p-4 cursor-pointer transition-colors ${
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
                        <span className="inline-block mr-3">
                          <span className="font-medium">Sizes:</span> {item.sizes.join(', ')}
                        </span>
                        <span className="inline-block">
                          <span className="font-medium">Colors:</span> {item.colors.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Details Section */}
            {selectedProduct && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Size Selection */}
                <div>
                  <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Size
                  </label>
                  <select
                    value={saleData.size}
                    onChange={(e) => setSaleData(prev => ({ ...prev, size: e.target.value }))}
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

                {/* Quantity Input */}
                <div>
                  <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={saleData.quantity}
                    onChange={(e) => setSaleData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                {/* Price Input */}
                <div>
                  <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Price (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleData.price}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      setSaleData(prev => ({
                        ...prev,
                        price: newPrice,
                        isHaggled: newPrice !== prev.originalPrice
                      }));
                    }}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                      } ${saleData.isHaggled ? 'border-yellow-500 border-2' : ''}`}
                      required
                    />
                    {saleData.isHaggled && (
                      <div className={`mt-1 text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        Original: KES {saleData.originalPrice.toFixed(2)} 
                        ({((saleData.originalPrice - saleData.price) / saleData.originalPrice * 100).toFixed(1)}% off)
                      </div>
                    )}
                  </div>
  
                  {/* Customer Details */}
                  <div>
                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={saleData.customerName}
                      onChange={(e) => setSaleData(prev => ({ ...prev, customerName: e.target.value }))}
                      className={`w-full p-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
  
                  <div>
                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={saleData.customerPhone}
                      onChange={(e) => setSaleData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className={`w-full p-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
  
                  <div>
                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Sale Date
                    </label>
                    <input
                      type="date"
                      value={saleData.saleDate}
                      onChange={(e) => setSaleData(prev => ({ ...prev, saleDate: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full p-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      required
                    />
                  </div>
  
                  {/* Payment Section */}
                  <div className="col-span-full">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className={`font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Payment Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {saleData.payments.map((payment, index) => (
                          <div key={payment.method}>
                            <label className={`block mb-1 text-sm capitalize ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {payment.method}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={payment.amount}
                              onChange={(e) => {
                                const newPayments = [...saleData.payments];
                                newPayments[index] = {
                                  ...payment,
                                  amount: parseFloat(e.target.value) || 0
                                };
                                setSaleData(prev => ({ ...prev, payments: newPayments }));
                              }}
                              className={`w-full p-2 rounded-lg border ${
                                isDarkMode 
                                  ? 'bg-gray-600 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300'
                              }`}
                              placeholder={`Enter amount`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
  
                  {/* Summary Section */}
                  <div className="col-span-full">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className={`font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Sale Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Unit Price:</span>
                          <span className="font-medium">KES {saleData.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Quantity:</span>
                          <span className="font-medium">{saleData.quantity}</span>
                        </div>
                        {saleData.isHaggled && (
                          <div className="flex justify-between text-yellow-500">
                            <span>Total Discount:</span>
                            <span>KES {((saleData.originalPrice - saleData.price) * saleData.quantity).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Total Payments:</span>
                          <span className="font-medium">KES {calculateTotalPayments().toFixed(2)}</span>
                        </div>
                        <div className={`pt-2 mt-2 border-t ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className="flex justify-between text-lg font-bold">
                            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total Amount:</span>
                            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              KES {(saleData.price * saleData.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
  
              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 
                    text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={processing}
                >
                  <ShoppingCart size={20} className="mr-2" />
                  {processing ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
  
  export default MakeSalePage;