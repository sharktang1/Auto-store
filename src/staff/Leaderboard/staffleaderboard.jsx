import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Trophy } from 'lucide-react';

const LeaderboardCard = ({ rank, name, storeNumber, stockMoved, cashMade }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
    className="p-6 rounded-lg shadow-md bg-orange-500 transition duration-300"
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-white text-xs opacity-80">Rank #{rank}</p>
        <h3 className="text-white text-lg font-semibold">{name}</h3>
        <p className="text-white text-sm">{storeNumber}</p>
      </div>

      <div className="text-right">
        <motion.div
          className="flex items-center gap-2 text-white"
          whileHover={{ scale: 1.1 }}
        >
          <DollarSign size={18} />
          <span>{cashMade.toFixed(2)}</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 text-white mt-2"
          whileHover={{ scale: 1.1 }}
        >
          <Trophy size={18} />
          <span>{stockMoved} items</span>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const Leaderboard = () => {
  const leaderboardData = [
    { name: 'John Doe', storeNumber: 'Store #1', stockMoved: 300, cashMade: 4560.00 },
    { name: 'Jane Smith', storeNumber: 'Store #2', stockMoved: 280, cashMade: 4300.00 },
    { name: 'Emma Brown', storeNumber: 'Store #3', stockMoved: 250, cashMade: 3875.50 },
    { name: 'Oliver Green', storeNumber: 'Store #1', stockMoved: 220, cashMade: 3360.00 },
    { name: 'Lucas White', storeNumber: 'Store #2', stockMoved: 200, cashMade: 3000.00 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Leaderboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboardData.map((staff, index) => (
          <LeaderboardCard
            key={index}
            rank={index + 1}
            name={staff.name}
            storeNumber={staff.storeNumber}
            stockMoved={staff.stockMoved}
            cashMade={staff.cashMade}
          />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
