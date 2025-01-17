// AdminStats.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { StatsSelector } from './StatsSelector';
import { SalesStats } from './SalesStats';
import InventoryStats from './InventoryStats'; // Changed to default import
import { StaffStats } from './StaffStats';
import StoresStats from './StoresStats';
import { getInitialTheme } from '../../utils/theme';

const AdminStats = () => {
  const [isDarkMode] = useState(getInitialTheme());
  const [activeTab, setActiveTab] = useState('sales');

  const renderStats = () => {
    const props = { isDarkMode };
    
    switch (activeTab) {
      case 'sales':
        return <SalesStats {...props} />;
      case 'inventory':
        return <InventoryStats {...props} />;
      case 'staff':
        return <StaffStats {...props} />;
      case 'stores':
        return <StoresStats {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Statistics & Analytics
        </h1>

        <StatsSelector
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
        />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStats()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminStats;