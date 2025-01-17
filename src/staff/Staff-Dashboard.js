import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import StaffNavbar from '../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../utils/theme';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Sample data for charts remains the same
const sampleSalesData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

const sampleInventoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Food', value: 20 },
  { name: 'Books', value: 20 },
];

const COLORS = ['#f97316', '#3b82f6', '#a855f7', '#10b981'];

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

const StatsCard = ({ isDarkMode }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} cursor-pointer`}
  >
    <div className="grid grid-cols-2 gap-4">
      <div className="h-64">
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Sales Trend
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleSalesData} barSize={8}>
            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64">
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Inventory Mix
        </h3>
        <div className="h-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sampleInventoryData}
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {sampleInventoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`mt-4 p-4 rounded-lg bg-opacity-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daily Sales</span>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>+8.5%</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock Level</span>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>92%</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Transaction</span>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>$45.20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

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
    
    // Fetch user data from Firestore
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Store Inventory"
            value="524"
            icon={Package}
            color="bg-blue-500"
            onClick={() => navigate('/staff/inventory')}
          />
          <DashboardCard
            title="Today's Sales"
            value="$2,845"
            icon={DollarSign}
            color="bg-green-500"
            onClick={() => navigate('/staff/sales')}
          />
          <DashboardCard
            title="Lender"
            icon={TrendingUp}
            color="bg-orange-500"
            onClick={() => navigate('/staff/KOPA')}
          />
        </div>

        <StatsCard isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default StaffDashboard;