// StaffSales.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Search, Calendar } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import StaffNavbar from '../../components/StaffNavbar';
import MakeSale from './MakeSale';
import ViewSales from './ViewSales';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

const StaffSales = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [isMakingSale, setIsMakingSale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState({
    id: null,
    location: null,
    storeNumber: null
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let unsubscribeTheme = initializeThemeListener(setIsDarkMode);

    const fetchStoreData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          toast.error('Please sign in to continue');
          setLoading(false);
          return;
        }

        setUserId(currentUser.uid);

        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          toast.error('User data not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const userLocation = userData.location;

        if (!userLocation) {
          toast.error('Store location not assigned');
          setLoading(false);
          return;
        }

        // Fetch store data from businesses collection
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

        if (!storeInfo) {
          toast.error('Store information not found');
          setLoading(false);
          return;
        }

        setStoreData(storeInfo);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching store data:', error);
        toast.error('Error connecting to database');
        setLoading(false);
      }
    };

    fetchStoreData();
    
    return () => {
      if (typeof unsubscribeTheme === 'function') unsubscribeTheme();
    };
  }, []);

  const handleSaleComplete = () => {
    setIsMakingSale(false);
    toast.success('Sale recorded successfully');
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
              Sales Management
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

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsMakingSale(!isMakingSale)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isMakingSale
                  ? 'bg-gray-500 hover:bg-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isMakingSale ? (
                <>View Sales</>
              ) : (
                <>
                  <Plus size={20} className="mr-2" />
                  Make New Sale
                </>
              )}
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              isDarkMode ? 'border-white' : 'border-blue-500'
            }`} />
          </div>
        ) : (
          <>
            {isMakingSale ? (
              <MakeSale
                storeData={storeData}
                userId={userId}
                onClose={() => setIsMakingSale(false)}
                onSaleComplete={handleSaleComplete}
                isDarkMode={isDarkMode}
              />
            ) : (
              <ViewSales
                storeData={storeData}
                userId={userId}
                isDarkMode={isDarkMode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffSales;