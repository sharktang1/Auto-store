import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Download } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';

const ViewSales = ({ storeData, userId, isDarkMode }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (!storeData?.id || !userId) {
      console.error('Missing required parameters:', { storeData, userId });
      toast.error('Error: Missing store or user information');
      setLoading(false);
      return;
    }

    const salesRef = collection(db, 'sales');
    const salesQuery = query(
      salesRef,
      where('storeId', '==', storeData.id),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      try {
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSales(salesData);
      } catch (error) {
        console.error('Error processing sales data:', error);
        toast.error('Error processing sales data');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in sales query:', error);
      toast.error('Error loading sales data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeData?.id, userId]);

  useEffect(() => {
    let filtered = [...sales];

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.timestamp?.toDate();
        return saleDate && saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSales(filtered);

    // Calculate totals
    const totals = filtered.reduce((acc, sale) => ({
      count: acc.count + 1,
      revenue: acc.revenue + (sale.price * sale.quantity)
    }), { count: 0, revenue: 0 });

    setTotalSales(totals.count);
    setTotalRevenue(totals.revenue);
  }, [sales, searchTerm, startDate, endDate]);

  const exportToCSV = () => {
    try {
      if (filteredSales.length === 0) {
        toast.warning('No data to export');
        return;
      }

      const headers = ['Date', 'Product', 'Size', 'Quantity', 'Price', 'Total', 'Customer', 'Payment Method'];
      const csvData = filteredSales.map(sale => [
        sale.timestamp?.toDate().toLocaleDateString() || 'N/A',
        sale.productName || 'N/A',
        sale.size || 'N/A',
        sale.quantity || 0,
        sale.price || 0,
        ((sale.price || 0) * (sale.quantity || 0)).toFixed(2),
        sale.customerName || 'N/A',
        sale.paymentMethod || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

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
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by product name, customer, or sale ID..."
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
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              placeholderText="Start Date"
              className={`p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              placeholderText="End Date"
              minDate={startDate}
              className={`p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-center">Size</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
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
                  <td className="p-3">
                    {sale.timestamp?.toDate().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="p-3">{sale.productName}</td>
                  <td className="p-3 text-center">{sale.size}</td>
                  <td className="p-3 text-right">{sale.quantity}</td>
                  <td className="p-3 text-right">KES {sale.price?.toFixed(2)}</td>
                  <td className="p-3 text-right">KES {((sale.price || 0) * (sale.quantity || 0)).toFixed(2)}</td>
                  <td className="p-3">{sale.customerName || 'N/A'}</td>
                  <td className="p-3 capitalize">{sale.paymentMethod || 'N/A'}</td>
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