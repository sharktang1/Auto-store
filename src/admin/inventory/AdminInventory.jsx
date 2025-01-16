import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, History, Download } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import Navbar from '../../components/Navbar';
import UpdateInventory from './UpdateInventory';
import ViewInventory from './ViewInventory';
import { initializeThemeListener, getInitialTheme } from '../../utils/theme';
import { initializeInventory } from '../../utils/admin-inventory';

const InventoryPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStore, setSelectedStore] = useState('all');
  const [stores, setStores] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    initializeInventory();

    const fetchStores = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          setLoading(false);
          return;
        }

        const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
        if (!businessDoc.exists()) {
          setLoading(false);
          return;
        }

        const businessData = businessDoc.data();
        const storeLocations = businessData.locations || [];
        
        setStores(storeLocations.map((location, index) => ({
          id: `store-${index + 1}`,
          name: `${businessData.businessName} - Store ${index + 1}`,
          location
        })));
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
    return cleanup;
  }, []);

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsUpdateMode(true);
  };

  const handleInventoryUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Inventory Management
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your inventory across all stores
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Store className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} size={20} />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border appearance-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.location}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedItem(null);
                setIsUpdateMode(!isUpdateMode);
              }}
              className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                isUpdateMode
                  ? 'bg-gray-500 hover:bg-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white min-w-[140px]`}
            >
              {isUpdateMode ? (
                <div className="flex items-center gap-2">
                  <History size={20} />
                  View Inventory
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus size={20} />
                  Add New Item
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {isUpdateMode ? (
          <UpdateInventory
            item={selectedItem}
            selectedStore={selectedStore}
            onClose={() => {
              setIsUpdateMode(false);
              setSelectedItem(null);
            }}
            onInventoryUpdate={handleInventoryUpdate}
            isDarkMode={isDarkMode}
          />
        ) : (
          <ViewInventory
            key={refreshTrigger}
            onEditItem={handleEditItem}
            selectedStore={selectedStore}
            onInventoryUpdate={handleInventoryUpdate}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;