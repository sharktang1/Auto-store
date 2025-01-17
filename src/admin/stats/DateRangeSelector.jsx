// src/admin/stats/components/DateRangeSelector.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const DateRangeSelector = ({ dateRange, setDateRange, isDarkMode }) => {
  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];

  return (
    <div className="flex space-x-2 mb-6">
      {ranges.map(({ label, value }) => (
        <motion.button
          key={value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDateRange(value)}
          className={`px-3 py-1 rounded-lg text-sm
            ${dateRange === value
              ? 'bg-orange-500 text-white'
              : isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } shadow-sm transition-colors`}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
};