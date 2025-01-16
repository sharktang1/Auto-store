import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Search, Edit, AlertCircle, Info, Download } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import StaffNavbar from '../../components/StaffNavbar';
import StaffUpdateInventory from './StaffUpdateInventory';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

const StaffInventory = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchParams, setSearchParams] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [showStockInfo, setShowStockInfo] = useState(false);

  useEffect(() => {
    let unsubscribeTheme = initializeThemeListener(setIsDarkMode);
    let unsubscribeInventory = null;

    const setupInventoryListener = async () => {
      try {
        const auth = getAuth();
        if (!auth.currentUser) {
          toast.error('Please sign in to view inventory');
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserRole(userData.role || 'staff');
        setUserLocation(userData.location || null);

        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesRef);
        
        let currentStoreId = null;
        
        for (const doc of businessesSnapshot.docs) {
          const locations = doc.data().locations || [];
          const locationIndex = locations.findIndex(loc => loc === userData.location);
          if (locationIndex !== -1) {
            currentStoreId = `store-${locationIndex + 1}`;
            break;
          }
        }

        if (!currentStoreId && userData.role !== 'admin') {
          toast.error('Store location not found');
          setLoading(false);
          return;
        }

        setStoreId(currentStoreId);

        const inventoryRef = collection(db, 'inventory');
        
        if (userData.role === 'admin') {
          unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              sizes: Array.isArray(doc.data().sizes) ? doc.data().sizes : (doc.data().sizes || '').split(',').map(s => s.trim()).filter(Boolean),
              colors: Array.isArray(doc.data().colors) ? doc.data().colors : (doc.data().colors || '').split(',').map(c => c.trim()).filter(Boolean),
              incompletePairs: doc.data().incompletePairs || 0,
              notes: doc.data().notes || ''
            }));
            setInventory(inventoryData);
            setLoading(false);
          });
        } else {
          const storeQuery = query(inventoryRef, where('storeId', '==', currentStoreId));
          unsubscribeInventory = onSnapshot(storeQuery, (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              sizes: Array.isArray(doc.data().sizes) ? doc.data().sizes : (doc.data().sizes || '').split(',').map(s => s.trim()).filter(Boolean),
              colors: Array.isArray(doc.data().colors) ? doc.data().colors : (doc.data().colors || '').split(',').map(c => c.trim()).filter(Boolean),
              incompletePairs: doc.data().incompletePairs || 0,
              notes: doc.data().notes || ''
            }));
            setInventory(inventoryData);
            setLoading(false);
          });
        }
      } catch (error) {
        console.error('Error setting up inventory:', error);
        toast.error('Error loading inventory data');
        setLoading(false);
      }
    };

    setupInventoryListener();
    
    return () => {
      if (typeof unsubscribeTheme === 'function') unsubscribeTheme();
      if (typeof unsubscribeInventory === 'function') unsubscribeInventory();
    };
  }, []);

  useEffect(() => {
    if (inventory.length > 0) {
      let filtered = inventory;
      
      if (searchParams.length > 0) {
        filtered = inventory.filter(item => {
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
      }
      
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory([]);
    }
  }, [inventory, searchParams]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Split the search input by '+' and trim each parameter
    const params = value.split('+').map(param => param.trim()).filter(param => param.length > 0);
    setSearchParams(params);
  };

  const calculateTotalShoes = (item) => {
    const completePairs = item.stock - item.incompletePairs;
    return (completePairs * 2) + parseInt(item.incompletePairs);
  };

  const handleInventoryUpdate = () => {
    toast.success('Inventory updated successfully');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Inventory Management
            </h1>
            {userLocation && (
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Store className="inline mr-2 mb-1" size={18} />
                {userLocation}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {userRole === 'staff-admin' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedItem(null);
                  setIsUpdateMode(!isUpdateMode);
                }}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  isUpdateMode
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {isUpdateMode ? (
                  <>View Inventory</>
                ) : (
                  <>
                    <Plus size={20} className="mr-2" />
                    Add New Item
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {isUpdateMode && userRole === 'staff-admin' ? (
          <StaffUpdateInventory
            item={selectedItem}
            selectedStore={storeId}
            onClose={() => {
              setIsUpdateMode(false);
              setSelectedItem(null);
            }}
            onInventoryUpdate={handleInventoryUpdate}
            isDarkMode={isDarkMode}
          />
        ) : (
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
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 placeholder-gray-500'
                    }`}
                    value={searchInput}
                    onChange={handleSearchInput}
                  />
                </div>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Use + to combine search parameters (e.g., @No + Color + Size)
                </p>
              </div>

              <div className="relative">
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
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                  isDarkMode ? 'border-white' : 'border-blue-500'
                }`} />
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
                      {userRole === 'staff-admin' && <th className="p-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === 'staff-admin' ? 12 : 11} className="text-center py-4">
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            No inventory items found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
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
                        {userRole === 'staff-admin' && (
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsUpdateMode(true);
                                }}
                                className="p-1 text-blue-500 hover:text-blue-600"
                              >
                                <Edit size={18} />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
};

export default StaffInventory;