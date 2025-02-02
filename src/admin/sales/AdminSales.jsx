import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Download,
  Store,
  Users,
  ArrowUpDown,
  Info
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import ProductInfo  from './Info';

const AdminSales = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [staffData, setStaffData] = useState({});
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    totalQuantity: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    fetchSales();
    return () => cleanup?.();
  }, []);

  const fetchStaffData = async (userId) => {
    if (!userId) return { 
      name: 'Unknown Staff',
      username: 'unknown',
      role: 'staff',
      location: 'Unknown'
    };

    try {
      if (staffData[userId]) return staffData[userId];

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return { 
        name: 'Unknown Staff',
        username: 'unknown',
        role: 'staff',
        location: 'Unknown'
      };

      const userData = userDoc.data();
      const staffInfo = {
        name: `${userData.firstName} ${userData.lastName}`,
        username: userData.username || 'unknown',
        role: userData.role || 'staff',
        location: userData.location || 'Unknown'
      };

      setStaffData(prev => ({ ...prev, [userId]: staffInfo }));
      return staffInfo;
    } catch (error) {
      console.error('Error fetching staff data:', error);
      return { 
        name: 'Unknown Staff',
        username: 'unknown',
        role: 'staff',
        location: 'Unknown'
      };
    }
  };

  const fetchSales = () => {
    try {
      const salesRef = collection(db, 'sales');
      const salesQuery = query(salesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(salesQuery, async (snapshot) => {
        try {
          const salesPromises = snapshot.docs.map(async (doc) => {
            const saleData = doc.data();
            const staffInfo = await fetchStaffData(saleData.userId);

            return {
              id: doc.id,
              ...saleData,
              timestamp: saleData.timestamp?.toDate() || new Date(),
              total: saleData.total || saleData.price * saleData.quantity || 0,
              staffName: staffInfo.name,
              staffUsername: staffInfo.username,
              staffRole: staffInfo.role,
              staffLocation: staffInfo.location
            };
          });

          const salesData = await Promise.all(salesPromises);
          setSales(salesData);
          setFilteredSales(salesData);
          calculateMetrics(salesData);
          setLoading(false);
        } catch (error) {
          console.error('Error processing sales data:', error);
          toast.error('Error processing sales data');
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up sales listener:', error);
      toast.error('Failed to set up sales listener');
      setLoading(false);
    }
  };

  const handleDateFilter = (e) => {
    const date = e.target.value;
    setFilterDate(date);
    applyFilters(date);
  };

  const applyFilters = (date) => {
    let filtered = sales;

    // Apply date filter
    if (date) {
      const filterDateStart = new Date(date);
      filterDateStart.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(date);
      filterDateEnd.setHours(23, 59, 59, 999);

      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= filterDateStart && saleDate <= filterDateEnd;
      });
    }

    setFilteredSales(filtered);
    calculateMetrics(filtered);
  };

  const calculateMetrics = (salesData) => {
    const metrics = salesData.reduce((acc, sale) => ({
      totalSales: acc.totalSales + (sale.total || 0),
      totalQuantity: acc.totalQuantity + (sale.quantity || 0)
    }), {
      totalSales: 0,
      totalQuantity: 0
    });

    metrics.averageOrderValue = salesData.length > 0 ? metrics.totalSales / salesData.length : 0;
    setSalesMetrics(metrics);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));

    const sorted = [...filteredSales].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (typeof a[key] === 'string') {
        return direction * a[key].localeCompare(b[key]);
      }
      return direction * (a[key] - b[key]);
    });

    setFilteredSales(sorted);
  };

  const handleInfoClick = (productId) => {
    setSelectedProductId(productId);
  };

  const closeProductInfo = () => {
    setSelectedProductId(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Store', 'Product ID', 'Quantity', 'Price', 'Total', 'Payment Method', 'Staff', 'Customer'];
    const csvData = filteredSales.map(sale => [
      sale.timestamp.toLocaleDateString(),
      sale.storeLocation,
      sale.productId,
      sale.quantity,
      sale.price,
      sale.total,
      sale.paymentMethod,
      sale.staffName,
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Dashboard
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            onClick={exportToCSV}
          >
            <Download size={20} />
            <span>Export CSV</span>
          </motion.button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Date Filter */}
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-8`}>
          <div className="flex flex-wrap gap-4">
            <input
              type="date"
              value={filterDate}
              onChange={handleDateFilter}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
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
                    { key: 'productId', label: 'Product ID' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'price', label: 'Price' },
                    { key: 'total', label: 'Total' },
                    { key: 'paymentMethod', label: 'Payment' },
                    { key: 'staffName', label: 'Staff Name' },
                    { key: 'staffUsername', label: 'Username' },
                    { key: 'customerName', label: 'Customer' },
                    { key: 'info', label: 'Info' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => column.key !== 'info' && handleSort(column.key)}
                      className={`px-6 py-3 text-left ${column.key !== 'info' ? 'cursor-pointer' : ''} ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.key !== 'info' && <ArrowUpDown size={14} />}
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
                      {sale.productId}
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
                      {sale.staffName}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.staffUsername}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {sale.customerName}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <button
                        onClick={() => handleInfoClick(sale.productId)}
                        className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                      >
                        <Info size={20} />
                      </button>
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
      </div>

      {selectedProductId && (
  <ProductInfo productId={selectedProductId} onClose={closeProductInfo} />
)}
    </div>
  );
};

export default AdminSales;