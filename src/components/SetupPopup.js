import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, MapPin, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { getInitialTheme } from '../utils/theme';

const SetupPopup = ({ isOpen, onClose, onSubmit }) => {
  const isDarkMode = getInitialTheme();
  const [formData, setFormData] = useState({
    businessName: '',
    numberOfStores: '1',
    locations: ['']
  });

  const isFormValid = () => {
    return (
      formData.businessName.trim() !== '' &&
      formData.locations.every(location => location.trim() !== '')
    );
  };

  const handleClose = () => {
    if (!isFormValid()) {
      toast.error('Please complete the setup form before closing', {
        position: "top-right",
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    onClose();
  };

  const handleLocationChange = (index, value) => {
    const newLocations = [...formData.locations];
    newLocations[index] = value;
    setFormData({ ...formData, locations: newLocations });
  };

  const addLocationField = () => {
    setFormData({
      ...formData,
      locations: [...formData.locations, '']
    });
  };

  const removeLocationField = (index) => {
    const newLocations = formData.locations.filter((_, i) => i !== index);
    setFormData({ ...formData, locations: newLocations });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    onSubmit(formData);
    toast.success('Setup completed successfully!', {
      position: "top-right",
      autoClose: 3000,
      theme: isDarkMode ? 'dark' : 'light'
    });
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
              onClick={handleClose}
              className={`absolute top-4 right-4 p-1 rounded-full hover:bg-opacity-10 ${
                isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
              }`}
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-6">Welcome to AutoStore</h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Let's set up your business profile
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Business Name
                </label>
                <div className="relative">
                  <Building className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`pl-10 w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your business name"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Number of Stores (Duka)
                </label>
                <div className="relative">
                  <Store className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <select
                    value={formData.numberOfStores}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        numberOfStores: e.target.value,
                        locations: Array(newCount).fill('').map((_, i) => formData.locations[i] || '')
                      });
                    }}
                    className={`pl-10 w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>Duka {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Store Locations
                </label>
                {formData.locations.map((location, index) => (
                  <div key={index} className="relative">
                    <MapPin className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => handleLocationChange(index, e.target.value)}
                      placeholder={`Enter location for Duka ${index + 1}`}
                      className={`pl-10 w-full p-2 rounded-md border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SetupPopup;