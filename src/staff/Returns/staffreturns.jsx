import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, Calendar, Store } from 'lucide-react';
import { collection, query, where, getDocs, runTransaction, doc, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import StaffNavbar from '../../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

const StaffReturn = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchParams, setSearchParams] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [storeData, setStoreData] = useState({
    id: null,
    location: null,
    storeNumber: null
  });

  useEffect(() => {
    const unsubscribeTheme = initializeThemeListener(setIsDarkMode);

    const fetchStoreData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          toast.error('Please sign in to continue');
          setLoading(false);
          return;
        }

        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('userId', '==', currentUser.uid)
        ));

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const userLocation = userData.location;

          const businessesRef = collection(db, 'businesses');
          const businessesSnapshot = await getDocs(businessesRef);
          
          let storeInfo = null;
          
          for (const doc of businessesSnapshot.docs) {
            const locations = doc.data().locations || [];
            const locationIndex = locations.findIndex(loc => loc === userLocation);
            
            if (locationIndex !== -1) {
              storeInfo = {
                id: `store-${locationIndex + 1}`,
                location: userLocation,
                storeNumber: locationIndex + 1
              };
              break;
            }
          }

          setStoreData(storeInfo);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        toast.error('Error loading store data');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
    return unsubscribeTheme;
  }, []);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    const params = value.split('+').map(param => param.trim()).filter(param => param.length > 0);
    setSearchParams(params);
  };

  useEffect(() => {
    const searchSales = async () => {
      if (searchParams.length === 0) {
        setFilteredSales([]);
        return;
      }

      try {
        const salesRef = collection(db, 'sales');
        const salesQuery = query(
          salesRef,
          where('storeId', '==', storeData.id)
        );
        
        const snapshot = await getDocs(salesQuery);
        const sales = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        const filtered = sales.filter(sale => {
          return searchParams.every(param => {
            const paramLower = param.toLowerCase().trim();
            return (
              sale.customerName?.toLowerCase().includes(paramLower) ||
              sale.customerPhone?.toLowerCase().includes(paramLower) ||
              sale.productName?.toLowerCase().includes(paramLower) ||
              sale.brand?.toLowerCase().includes(paramLower)
            );
          });
        });

        setFilteredSales(filtered);
      } catch (error) {
        console.error('Error searching sales:', error);
        toast.error('Error searching sales records');
      }
    };

    if (storeData.id) {
      searchSales();
    }
  }, [searchParams, storeData.id]);

  const handleReturn = async () => {
    if (!selectedSale || !returnReason) {
      toast.error('Please select a sale and provide a return reason');
      return;
    }

    setProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        // Add return record
        const returnRef = collection(db, 'returns');
        await addDoc(returnRef, {
          saleId: selectedSale.id,
          productId: selectedSale.productId,
          storeId: selectedSale.storeId,
          storeLocation: selectedSale.storeLocation,
          storeNumber: selectedSale.storeNumber,
          customerName: selectedSale.customerName,
          customerPhone: selectedSale.customerPhone,
          productName: selectedSale.productName,
          brand: selectedSale.brand,
          size: selectedSale.size,
          quantity: selectedSale.quantity,
          originalSalePrice: selectedSale.price,
          returnReason: returnReason,
          returnDate: Timestamp.now(),
          processedBy: getAuth().currentUser.uid
        });

        // Update inventory
        const inventoryRef = doc(db, 'inventory', selectedSale.productId);
        const inventoryDoc = await transaction.get(inventoryRef);
        
        if (!inventoryDoc.exists()) {
          throw new Error('Product not found in inventory');
        }

        const currentStock = inventoryDoc.data().stock || 0;
        transaction.update(inventoryRef, {
          stock: currentStock + selectedSale.quantity
        });
      });

      toast.success('Return processed successfully');
      setSelectedSale(null);
      setReturnReason('');
      setSearchInput('');
      setSearchParams([]);
      setFilteredSales([]);
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Error processing return');
    } finally {
      setProcessing(false);
    }
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 placeholder-gray-500'
  }`;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Process Returns
            </h1>
            {storeData.location && (
              <div className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="flex items-center">
                  <Store className="inline mr-2 mb-1" size={18} />
                  {storeData.location}
                </p>
                <p className="text-sm opacity-75 ml-6">Store #{storeData.storeNumber}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`w-full max-w-4xl mx-auto rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-6`}>
          <div className="space-y-6">
            <div className="relative">
              <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Search Sale
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
                  placeholder="Search by customer name + phone + product (e.g., John + 0712345678)"
                  className={`${inputClasses} pl-10`}
                />
              </div>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use + to combine search parameters
              </p>
            </div>

            {filteredSales.length > 0 && (
              <div className="mt-4 space-y-4">
                {filteredSales.map((sale) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg cursor-pointer border-2 ${
                      selectedSale?.id === sale.id
                        ? isDarkMode 
                          ? 'border-blue-500 bg-gray-700' 
                          : 'border-blue-500 bg-blue-50'
                        : isDarkMode
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSale(sale)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {sale.productName} - {sale.brand}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Size: {sale.size} | Quantity: {sale.quantity}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Customer: {sale.customerName || 'N/A'} | Phone: {sale.customerPhone || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          KES {sale.total.toFixed(2)}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {sale.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {selectedSale && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Return Reason
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className={`${inputClasses} min-h-[100px]`}
                    placeholder="Enter the reason for return..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedSale(null);
                      setReturnReason('');
                    }}
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
                    onClick={handleReturn}
                    className="flex items-center px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={processing}
                  >
                    <RotateCcw size={20} className="mr-2" />
                    {processing ? 'Processing...' : 'Process Return'}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffReturn;