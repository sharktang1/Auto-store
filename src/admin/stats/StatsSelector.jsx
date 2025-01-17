import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Package, Store } from 'lucide-react';

export const StatsSelector = ({ activeTab, setActiveTab, isDarkMode }) => {
  const tabs = [
    { id: 'sales', icon: BarChart2, label: 'Sales' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'stores', icon: Store, label: 'Stores' }
  ];

  return (
    <div className="flex space-x-4 mb-6">
      {tabs.map(({ id, icon: Icon, label }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg
            ${activeTab === id
              ? 'bg-orange-500 text-white'
              : isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } shadow-sm transition-colors`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default StatsSelector;