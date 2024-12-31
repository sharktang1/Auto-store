import React from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, Users, TrendingUp, ShoppingCart, UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { getInitialTheme } from '../utils/theme';

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

const sampleStaffData = [
  { name: 'Mon', performance: 85 },
  { name: 'Tue', performance: 92 },
  { name: 'Wed', performance: 88 },
  { name: 'Thu', performance: 95 },
  { name: 'Fri', performance: 90 },
];

const COLORS = ['#f97316', '#3b82f6', '#a855f7', '#10b981'];

// DashboardCard Component
const DashboardCard = ({ title, value, icon: Icon, color, to }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="cursor-pointer"
    onClick={() => window.location.href = to}
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

// ActivityItem Component
const ActivityItem = ({ icon: Icon, title, description, time, to, isDarkMode }) => (
  <Link to={to}>
    <motion.div 
      className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer"
      whileHover={{ 
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        scale: 1.01 
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="bg-orange-100 rounded-full p-2">
        <Icon className="text-orange-500" size={20} />
      </div>
      <div className="flex-grow">
        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{time}</p>
      </div>
      <div className="flex items-center">
        <ArrowRight className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={16} />
      </div>
    </motion.div>
  </Link>
);

const StatsPreviewCard = ({ isDarkMode }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} cursor-pointer`}
    onClick={() => window.location.href = '/stats'}
  >
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32">
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Sales Trend
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleSalesData.slice(-4)} barSize={8}>
            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-32">
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Inventory Mix
        </h3>
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

      <div className="h-32">
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Staff Performance
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampleStaffData}>
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`h-32 p-4 rounded-lg bg-opacity-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Key Metrics
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Growth Rate</span>
            <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>+15.8%</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Conversion</span>
            <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>4.2%</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order</span>
            <span className={`text-xs font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>$85.30</span>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-4 flex justify-between items-center">
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Click to view detailed statistics
      </span>
      <ArrowRight className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} size={16} />
    </div>
  </motion.div>
);

const Dashboard = () => {
  // Get initial theme state from the utility function
  const isDarkMode = getInitialTheme();

  // Mock user data - in a real app, this would come from your auth context or state management
  const userData = {
    username: "John Doe",
    email: "john@example.com",
    isAdmin: true
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar
          username={userData.username}
          email={userData.email}
          isAdmin={userData.isAdmin}
        />
      </div>
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Overview
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Inventory"
            value="1,234"
            icon={Package}
            color="bg-blue-500"
            to="/inventory"
          />
          <DashboardCard
            title="Total Sales"
            value="$45,678"
            icon={DollarSign}
            color="bg-green-500"
            to="/sales"
          />
          <DashboardCard
            title="Active Staff"
            value="23"
            icon={Users}
            color="bg-purple-500"
            to="/staff"
          />
          <DashboardCard
            title="Monthly Growth"
            value="+15%"
            icon={TrendingUp}
            color="bg-orange-500"
            to="/stats"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatsPreviewCard isDarkMode={isDarkMode} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h2>
            <div className="space-y-4">
              <ActivityItem
                icon={ShoppingCart}
                title="New Order"
                description="Order #12345 received"
                time="5 mins ago"
                to="/orders/12345"
                isDarkMode={isDarkMode}
              />
              <ActivityItem
                icon={Package}
                title="Stock Update"
                description="Inventory updated for 'Product X'"
                time="2 hours ago"
                to="/inventory/product-x"
                isDarkMode={isDarkMode}
              />
              <ActivityItem
                icon={UserCheck}
                title="Staff Login"
                description="Jane Doe logged in"
                time="3 hours ago"
                to="/staff/jane-doe"
                isDarkMode={isDarkMode}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;