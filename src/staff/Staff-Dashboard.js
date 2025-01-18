import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, RefreshCcw, HandCoins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StaffNavbar from '../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../utils/theme';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const DashboardCard = ({ title, value, icon: Icon, color, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-6 rounded-lg shadow-md ${color} h-full`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white text-sm mb-1 opacity-90">{title}</p>
            <h3 className="text-white text-2xl font-bold">{value}</h3>
          </div>
          <Icon className="text-white opacity-80" size={24} />
        </div>
      </div>
    </motion.div>
  );
};

const StaffDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    location: '',
    storeNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              username: data.username || '',
              email: data.email || '',
              location: data.location || '',
              storeNumber: data.storeNumber || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return cleanup;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar
          username={userData.username}
          email={userData.email}
        />
      </div>
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Store Dashboard
          </h1>
          <div className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-lg">{userData.location}</p>
            <p className="text-sm opacity-75">Store #{userData.storeNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Store Inventory"
            value="0000"
            icon={Package}
            color="bg-blue-500"
            onClick={() => navigate('/staff/inventory')}
          />
          <DashboardCard
            title="Today's Sales"
            value="$000"
            icon={DollarSign}
            color="bg-green-500"
            onClick={() => navigate('/staff/sales')}
          />
          <DashboardCard
            title="Lender"
            value="00"
            icon={HandCoins}
            color="bg-orange-500"
            onClick={() => navigate('/staff/KOPA')}
          />
          <DashboardCard
            title="Returns"
            value="00"
            icon={RefreshCcw}
            color="bg-purple-500"
            onClick={() => navigate('/staff/returns')}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;