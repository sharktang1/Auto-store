// staff/components/StaffSetupPopup.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { getInitialTheme } from '../utils/theme';

const StaffSetupPopup = ({ isOpen, onClose, onSubmit }) => {
  const isDarkMode = getInitialTheme();
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location.trim()) {
      toast.error('Please enter your store location', {
        theme: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    onSubmit({ location });
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

            <h2 className="text-2xl font-bold mb-6">Welcome to AutoStore Staff Portal</h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Please select your store location
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <MapPin className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`pl-10 w-full p-2 rounded-md border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your store location"
                />
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffSetupPopup;