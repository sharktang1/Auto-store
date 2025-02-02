import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Download } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const ViewSales = ({ storeData, userId, userRole, isDarkMode }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Fetch sales data
  useEffect(() => {
    if (!userId || !['staff', 'staff-admin'].includes(userRole)) {
      console.error('Missing required parameters or unauthorized:', { userId, userRole });
      toast.error('Error: Missing information or unauthorized access');
      setLoading(false);
      return;
    }

    const salesRef = collection(db, 'sales');
    const salesQuery = query(
      salesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        try {
          const salesData = snapshot.docs.map(doc => ({
            id: doc.id,  // Document ID
            documentId: doc.id,  // Additional field for document ID
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          }));
          console.log('Fetched sales data:', salesData);
          setSales(salesData);
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
  }, [userId, userRole]);

  // Filter sales based on search term and time period
  useEffect(() => {
    let filtered = [...sales];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(sale => {
        const saleDate = sale.timestamp;
        switch (selectedPeriod) {
          case 'day':
            return saleDate >= today;
          case 'week': {
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            return saleDate >= lastWeek;
          }
          case 'month': {
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return saleDate >= lastMonth;
          }
          case 'year': {
            const lastYear = new Date(today);
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            return saleDate >= lastYear;
          }
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.productName?.toLowerCase().includes(searchLower) ||
        sale.customerName?.toLowerCase().includes(searchLower) ||
        sale.brand?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSales(filtered);
    
    const totals = filtered.reduce((acc, sale) => ({
      count: acc.count + 1,
      revenue: acc.revenue + (sale.total || 0)
    }), { count: 0, revenue: 0 });

    setTotalSales(totals.count);
    setTotalRevenue(totals.revenue);
  }, [sales, searchTerm, selectedPeriod]);

  const exportToCSV = () => {
    try {
      if (filteredSales.length === 0) {
        toast.warning('No data to export');
        return;
      }

      const headers = ['Document ID', 'Date', 'Brand', 'Product', 'Size', 'Quantity', 'Price', 'Total', 'Customer', 'Phone', 'Payment Method'];
      const csvData = filteredSales.map(sale => [
        sale.documentId || 'N/A',
        sale.timestamp?.toLocaleDateString() || 'N/A',
        sale.brand || 'N/A',
        sale.productName || 'N/A',
        sale.size || 'N/A',
        sale.quantity || 0,
        sale.price || 0,
        sale.total?.toFixed(2) || '0.00',
        sale.customerName || 'N/A',
        sale.customerPhone || 'N/A',
        sale.paymentMethod || 'N/A'
      ]);

      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Sales data exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export sales data');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          isDarkMode ? 'border-white' : 'border-blue-500'
        }`} />
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by brand, product name, or customer..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'} />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Total Sales
          </h3>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {totalSales}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Total Revenue
          </h3>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            KES {totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <th className="p-3 text-left">Document ID</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-center">Size</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-4">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No sales records found
                  </p>
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-t ${
                    isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <td className="p-3">{sale.documentId}</td>
                  <td className="p-3">
                    {sale.timestamp?.toLocaleDateString()}
                  </td>
                  <td className="p-3">{sale.brand}</td>
                  <td className="p-3">{sale.productName}</td>
                  <td className="p-3 text-center">{sale.size}</td>
                  <td className="p-3 text-right">{sale.quantity}</td>
                  <td className="p-3 text-right">KES {sale.price?.toFixed(2)}</td>
                  <td className="p-3 text-right">KES {sale.total?.toFixed(2)}</td>
                  <td className="p-3">{sale.customerName || 'N/A'}</td>
                  <td className="p-3">{sale.customerPhone || 'N/A'}</td>
                  <td className="p-3 capitalize">{sale.paymentMethod}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewSales;