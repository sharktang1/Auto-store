import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Search, Edit } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);

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

        // Get user data directly from Firestore
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserRole(userData.role || 'staff');
        setUserLocation(userData.location || null);

        // Get business data to determine store ID
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

        // Set up inventory listener based on user role and store
        const inventoryRef = collection(db, 'inventory');
        
        if (userData.role === 'admin') {
          unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setInventory(inventoryData);
            setLoading(false);
          });
        } else {
          const storeQuery = query(inventoryRef, where('storeId', '==', currentStoreId));
          unsubscribeInventory = onSnapshot(storeQuery, (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
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
      const filtered = inventory.filter(item => {
        const matchesSearch = 
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      });
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory([]);
    }
  }, [inventory, searchTerm]);

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
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, category, brand..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 placeholder-gray-500'
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Brand</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Sizes</th>
                      <th className="p-3 text-center">Colors</th>
                      {userRole === 'staff-admin' && <th className="p-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === 'staff-admin' ? 9 : 8} className="text-center py-4">
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
                          <td className="p-3">{item.name}</td>
                          <td className="p-3">{item.brand}</td>
                          <td className="p-3">{item.category}</td>
                          <td className="p-3 text-right">${item.price}</td>
                          <td className="p-3 text-right">{item.stock}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.stock > 0 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-3 text-center">{Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}</td>
                          <td className="p-3 text-center">{Array.isArray(item.colors) ? item.colors.join(', ') : item.colors}</td>
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