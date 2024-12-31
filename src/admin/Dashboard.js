import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, Users, BarChart2, TrendingUp, ShoppingCart, UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';

const sampleData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

const DashboardCard = ({ title, value, icon: Icon, color, to }) => {
  return (
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
};

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const CustomBar = (props) => {
    const { x, y, width, height } = props;
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill="#f97316"
          rx={4}
          className="hover:fill-orange-400 transition-colors duration-200"
        />
      </g>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sales Overview
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#fff' : '#374151'} />
                  <YAxis stroke={isDarkMode ? '#fff' : '#374151'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1F2937' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ color: isDarkMode ? '#fff' : '#374151' }}
                  />
                  <Bar dataKey="value" shape={<CustomBar />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

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

export default Dashboard;