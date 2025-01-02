import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { getInitialTheme } from '../utils/theme';
import { db } from '../libs/firebase-config';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const StaffSetupPopup = ({ isOpen, onClose, onSubmit }) => {
  const isDarkMode = getInitialTheme();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'staff'
  });

  const auth = getAuth();

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const businessCollection = collection(db, 'businesses');
        const businessSnapshot = await getDocs(businessCollection);
        const data = businessSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBusinessData(data[0]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching business data:', error);
        toast.error('Failed to load store locations');
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchBusinessData();
      checkExistingStaffProfile();
    }
  }, [isOpen]);

  const checkExistingStaffProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setStaffInfo(prevInfo => ({
          ...prevInfo,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          role: userData.role || 'staff'
        }));
        if (userData.location) {
          setSelectedLocation(userData.location);
          setStoreNumber(userData.storeNumber || '');
        }
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
    }
  };

  const handleLocationSelect = (location, index) => {
    setSelectedLocation(location);
    setStoreNumber(`duka-${index + 1}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation || !storeNumber) {
      toast.error('Please select a Duka location');
      return;
    }

    if (!staffInfo.firstName || !staffInfo.lastName || !staffInfo.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const userData = {
        ...staffInfo,
        location: selectedLocation,
        storeNumber: storeNumber,
        email: auth.currentUser.email,
        username: auth.currentUser.email.split('@')[0],
        updatedAt: new Date().toISOString(),
        businessId: businessData.id
      };

      await setDoc(doc(db, 'users', auth.currentUser.uid), userData, { merge: true });

      onSubmit({ location: selectedLocation, storeNumber: storeNumber });
      toast.success('Staff profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving staff data:', error);
      toast.error('Failed to save staff information');
    }
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

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={staffInfo.firstName}
                        onChange={(e) => setStaffInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={staffInfo.lastName}
                        onChange={(e) => setStaffInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                        }`}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={staffInfo.phoneNumber}
                      onChange={(e) => setStaffInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select Location
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {businessData?.locations.map((location, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleLocationSelect(location, index)}
                          className={`flex items-center gap-2 p-3 rounded-md border transition-colors duration-200 ${
                            selectedLocation === location
                              ? 'bg-orange-500 text-white border-orange-600'
                              : isDarkMode
                              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Store size={18} />
                          <span>{location} (Duka {index + 1})</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
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