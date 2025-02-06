import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, RefreshCcw, HandCoins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StaffNavbar from '../components/StaffNavbar';
import ShoeRequestNotification from './ShoeRequestNotification';
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
  const auth = getAuth();

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          navigate('/auth');
          return;
        }
        
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
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return cleanup;
  }, [navigate, auth]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <StaffNavbar />
      
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
            value="View Stock"
            icon={Package}
            color="bg-blue-500"
            onClick={() => navigate('/staff/inventory')}
          />
          <DashboardCard
            title="Today's Sales"
            value="Track Sales"
            icon={DollarSign}
            color="bg-green-500"
            onClick={() => navigate('/staff/sales')}
          />
          <DashboardCard
            title="Lender"
            value="Manage"
            icon={HandCoins}
            color="bg-orange-500"
            onClick={() => navigate('/staff/KOPA')}
          />
          <DashboardCard
            title="Returns"
            value="Process"
            icon={RefreshCcw}
            color="bg-purple-500"
            onClick={() => navigate('/staff/returns')}
          />
        </div>

        {/* Stats or Recent Activity could go here */}
        <div className={`mt-8 p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Recent Activity
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Activity feed coming soon...
          </p>
        </div>
      </div>

      {/* Shoe Request Notification Component */}
      <ShoeRequestNotification isDarkMode={isDarkMode} />
    </div>
  );
};

export default StaffDashboard;