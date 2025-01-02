import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar,
  Download,
  Search,
  Store,
  Users,
  FilterX,
  ArrowUpDown
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminSales = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    totalQuantity: 0,
    averageOrderValue: 0,
    storeSales: {},
    staffSales: {}
  });

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    fetchSales();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const fetchSales = () => {
    try {
      const salesRef = collection(db, 'sales');
      const salesQuery = query(
        salesRef,
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(
        salesQuery,
        (snapshot) => {
          try {
            const salesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
              total: doc.data().total || doc.data().price * doc.data().quantity || 0
            }));
            
            console.log('Fetched sales data:', salesData); // For debugging
            setSales(salesData);
            setFilteredSales(salesData);
            calculateMetrics(salesData);
            setLoading(false);
          } catch (error) {
            console.error('Error processing sales data:', error);
            toast.error('Error processing sales data');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error in sales query:', error);
          toast.error(`Error loading sales data: ${error.message}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up sales listener:', error);
      toast.error('Failed to set up sales listener');
      setLoading(false);
    }
  };

  const calculateMetrics = (salesData) => {
    const metrics = salesData.reduce((acc, sale) => {
      // Total sales and quantity
      acc.totalSales += sale.total || 0;
      acc.totalQuantity += sale.quantity || 0;

      // Store sales
      if (sale.storeLocation) {
        acc.storeSales[sale.storeLocation] = (acc.storeSales[sale.storeLocation] || 0) + (sale.total || 0);
      }

      // Staff sales
      if (sale.customerName) {
        acc.staffSales[sale.customerName] = (acc.staffSales[sale.customerName] || 0) + (sale.total || 0);
      }

      return acc;
    }, {
      totalSales: 0,
      totalQuantity: 0,
      storeSales: {},
      staffSales: {}
    });

    metrics.averageOrderValue = salesData.length > 0 ? metrics.totalSales / salesData.length : 0;
    setSalesMetrics(metrics);
  };

  const filterSalesByTime = (filter) => {
    setTimeFilter(filter);
    const now = new Date();
    let filtered = [...sales];

    switch (filter) {
      case 'today':
        filtered = sales.filter(sale => 
          sale.timestamp?.toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = sales.filter(sale => sale.timestamp >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = sales.filter(sale => sale.timestamp >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        filtered = sales.filter(sale => sale.timestamp >= yearAgo);
        break;
      default:
        filtered = sales;
    }

    setFilteredSales(filtered);
    calculateMetrics(filtered);
  };

  const filterByDateRange = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const filtered = sales.filter(sale => {
      const saleDate = sale.timestamp;
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });

    setFilteredSales(filtered);
    calculateMetrics(filtered);
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = sales.filter(sale =>
      sale.customerName.toLowerCase().includes(term) ||
      sale.storeLocation.toLowerCase().includes(term) ||
      sale.productName.toLowerCase().includes(term)
    );

    setFilteredSales(filtered);
    calculateMetrics(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));

    const sorted = [...filteredSales].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });

    setFilteredSales(sorted);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Store', 'Product', 'Quantity', 'Price', 'Total', 'Payment Method', 'Customer'];
    const csvData = filteredSales.map(sale => [
      sale.timestamp.toLocaleDateString(),
      sale.storeLocation,
      sale.productName,
      sale.quantity,
      sale.price,
      sale.total,
      sale.paymentMethod,
      sale.customerName
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Dashboard
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg"
            onClick={exportToCSV}
          >
            <Download size={20} />
            <span>Export CSV</span>
          </motion.button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales</p>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${salesMetrics.totalSales.toLocaleString()}
                </h3>
              </div>
              <DollarSign className="text-orange-500" size={24} />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Items Sold</p>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {salesMetrics.totalQuantity.toLocaleString()}
                </h3>
              </div>
              <Store className="text-blue-500" size={24} />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order Value</p>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${salesMetrics.averageOrderValue.toFixed(2)}
                </h3>
              </div>
              <Users className="text-green-500" size={24} />
            </div>
          </motion.div>
        </div>

        {/* Filters Section */}
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-8`}>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                <input
                  type="text"
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {['today', 'week', 'month', 'year', 'all'].map((period) => (
                <button
                  key={period}
                  onClick={() => filterSalesByTime(period)}
                  className={`px-4 py-2 rounded-lg ${
                    timeFilter === period
                      ? 'bg-orange-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <button
              onClick={filterByDateRange}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Apply Date Range
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                filterSalesByTime('all');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              <FilterX size={20} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {[
                    { key: 'timestamp', label: 'Date' },
                    { key: 'storeLocation', label: 'Store' },
                    { key: 'productName', label: 'Product' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'price', label: 'Price' },
                    { key: 'total', label: 'Total' },
                    { key: 'paymentMethod', label: 'Payment' },
                    { key: 'customerName', label: 'Customer' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className={`px-6 py-3 text-left cursor-pointer ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className={`border-t ${
                      isDarkMode 
                        ? 'border-gray-700 hover:bg-gray-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.timestamp.toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.storeLocation}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.productName}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.quantity}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ${sale.price}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      ${sale.total}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.paymentMethod}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.customerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No sales data found
              </p>
            </div>
          )}
        </div>

        {/* Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Store Sales Chart */}
          <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sales by Store
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(salesMetrics.storeSales).map(([store, total]) => ({
                    name: store,
                    value: total
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                  />
                  <YAxis 
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                    labelStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                  />
                  <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Sales Chart */}
          <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sales by Staff
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(salesMetrics.staffSales).map(([staff, total]) => ({
                    name: staff,
                    value: total
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                  />
                  <YAxis 
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                    labelStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSales;