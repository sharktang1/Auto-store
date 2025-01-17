import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, CreditCard, TrendingUp, Package, DollarSign, Percent, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export const SalesStats = ({ isDarkMode }) => {
  const [salesData, setSalesData] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    averageTransaction: 0,
    popularPaymentMethod: '',
    topSellingBrand: '',
    mostPopularSize: '',
    haggleRate: 0,
    averageDiscount: 0,
    totalTransactions: 0,
    mostPopularStore: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const q = query(collection(db, 'sales'));
        const querySnapshot = await getDocs(q);
        const sales = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        const { processedData, statsAnalytics } = processSalesData(sales);
        setSalesData(processedData);
        setAnalytics(statsAnalytics);
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  const processSalesData = (sales) => {
    // Group sales by date
    const dailyTotals = sales.reduce((acc, sale) => {
      const date = new Date(sale.timestamp.toDate()).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {});

    // Calculate payment methods frequency
    const paymentMethods = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Calculate brand frequency
    const brands = sales.reduce((acc, sale) => {
      acc[sale.brand] = (acc[sale.brand] || 0) + 1;
      return acc;
    }, {});

    // Calculate store frequency
    const stores = sales.reduce((acc, sale) => {
      acc[sale.storeLocation] = (acc[sale.storeLocation] || 0) + 1;
      return acc;
    }, {});

    // Calculate sizes frequency
    const sizes = sales.reduce((acc, sale) => {
      acc[sale.size] = (acc[sale.size] || 0) + 1;
      return acc;
    }, {});

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const haggledSales = sales.filter(sale => sale.isHaggled).length;
    const totalDiscounts = sales.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0);

    const statsAnalytics = {
      totalSales,
      totalTransactions: sales.length,
      averageTransaction: totalSales / sales.length,
      popularPaymentMethod: Object.entries(paymentMethods).sort((a, b) => b[1] - a[1])[0][0],
      topSellingBrand: Object.entries(brands).sort((a, b) => b[1] - a[1])[0][0],
      mostPopularSize: Object.entries(sizes).sort((a, b) => b[1] - a[1])[0][0],
      mostPopularStore: Object.entries(stores).sort((a, b) => b[1] - a[1])[0][0],
      haggleRate: (haggledSales / sales.length) * 100,
      averageDiscount: totalDiscounts / sales.length,
      totalDiscounts
    };

    return {
      processedData: Object.entries(dailyTotals).map(([date, total]) => ({
        date,
        total
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      statsAnalytics
    };
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, animate = true }) => {
    const content = (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-lg h-full`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">{title}</h3>
          <Icon className="h-5 w-5 text-orange-500" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {typeof value === 'number' && !title.includes('Rate')
            ? `KSh${value.toLocaleString()}`
            : title.includes('Rate')
              ? `${value.toFixed(1)}%`
              : value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    );

    return animate ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    ) : content;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={analytics.totalSales}
          icon={DollarSign}
          subtitle={`${analytics.totalTransactions} transactions`}
        />
        <StatCard
          title="Average Sale"
          value={analytics.averageTransaction}
          icon={TrendingUp}
          subtitle="Per transaction"
        />
        <StatCard
          title="Total Discounts"
          value={analytics.totalDiscounts}
          icon={Percent}
          subtitle={`Avg: KSh${analytics.averageDiscount.toFixed(0)}`}
        />
        <StatCard
          title="Haggle Rate"
          value={analytics.haggleRate}
          icon={ShoppingBag}
          subtitle="Of all transactions"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}
      >
        <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Daily Sales Overview
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <XAxis
                dataKey="date"
                stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                tickFormatter={(value) => `KSh${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  color: isDarkMode ? 'white' : 'black'
                }}
                formatter={(value) => [`KSh${value.toLocaleString()}`, 'Sales']}
              />
              <Bar
                dataKey="total"
                radius={[20, 20, 0, 0]}
              >
                {salesData.map((entry, index) => (
                  <Cell key={index} fill="#F97316" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}>
          <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Insights
          </h2>
          <ul className="space-y-4">
            <li className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="font-medium">Popular Payment</span>
              <span className="text-orange-500">{analytics.popularPaymentMethod}</span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="font-medium">Top Brand</span>
              <span className="text-orange-500">{analytics.topSellingBrand}</span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="font-medium">Popular Size</span>
              <span className="text-orange-500">{analytics.mostPopularSize}</span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="font-medium">Top Store</span>
              <span className="text-orange-500">{analytics.mostPopularStore}</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default SalesStats;