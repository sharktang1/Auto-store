import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { getInitialTheme } from '../utils/theme';
import { db } from '../libs/firebase-config';
import { collection, getDocs } from 'firebase/firestore';

const StaffSetupPopup = ({ isOpen, onClose, onSubmit }) => {
  const isDarkMode = getInitialTheme();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const businessCollection = collection(db, 'businesses');
        const businessSnapshot = await getDocs(businessCollection);
        const data = businessSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBusinessData(data[0]); // Assuming we're working with the first business
        setLoading(false);
      } catch (error) {
        console.error('Error fetching business data:', error);
        toast.error('Failed to load store locations', {
          theme: isDarkMode ? 'dark' : 'light'
        });
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchBusinessData();
    }
  }, [isOpen, isDarkMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      toast.error('Please select a Duka location', {
        theme: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    onSubmit({ location: selectedLocation });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1 rounded-full hover:bg-opacity-10 ${
                isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
              }`}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Building size={24} className="text-orange-500" />
              <h2 className="text-2xl font-bold">Welcome to {businessData?.businessName}</h2>
            </div>
            
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Please select your Duka location
            </p>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {businessData?.locations.map((location, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setSelectedLocation(location)}
                      className={`flex items-center gap-2 p-3 rounded-md border transition-colors duration-200 ${
                        selectedLocation === location
                          ? 'bg-orange-500 text-white border-orange-600'
                          : isDarkMode
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Store size={18} />
                      <span>{location}</span>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 
                    transition-colors duration-200"
                >
                  Complete Setup
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffSetupPopup;