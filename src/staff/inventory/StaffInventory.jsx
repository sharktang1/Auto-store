import React, { useState, useEffect } from 'react';
import { Store, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import StaffNavbar from '../../components/StaffNavbar';
import StaffInventoryView from './StaffInventoryView';
import StaffUpdateInventory from './StaffUpdateInventory';

const StaffInventory = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userRole, setUserRole] = useState('staff');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Initialize theme listener to sync theme across components
    const unsubscribe = initializeThemeListener((newTheme) => {
      setIsDarkMode(newTheme);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsUpdateMode(true);
  };

  const handleInventoryUpdate = () => {
    setIsUpdateMode(false);
    setSelectedItem(null);
  };

  const handleThemeChange = (newTheme) => {
    setIsDarkMode(newTheme);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar onThemeChange={handleThemeChange} isDarkMode={isDarkMode} />
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

          {userRole === 'staff-admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedItem(null);
                setIsUpdateMode(!isUpdateMode);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isUpdateMode
                  ? 'bg-gray-500 hover:bg-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isUpdateMode ? (
                <>View Inventory</>
              ) : (
                <>
                  <Plus size={20} />
                  Add New Item
                </>
              )}
            </motion.button>
          )}
        </div>

        {isUpdateMode ? (
          <StaffUpdateInventory
            item={selectedItem}
            onClose={() => {
              setIsUpdateMode(false);
              setSelectedItem(null);
            }}
            onInventoryUpdate={handleInventoryUpdate}
            isDarkMode={isDarkMode}
          />
        ) : (
          <StaffInventoryView
            onEditItem={handleEditItem}
            isDarkMode={isDarkMode}
            onInventoryUpdate={handleInventoryUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default StaffInventory;