import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Download, Info } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';
import ProductInfoPopup from './ProductInfoPopup';

const ViewSales = ({ storeData, userId, userRole, isDarkMode }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch sales data
  useEffect(() => {
    if (!storeData.id || !['staff', 'staff-admin'].includes(userRole)) {
      console.error('Missing required parameters or unauthorized:', { storeData, userRole });
      toast.error('Error: Missing information or unauthorized access');
      setLoading(false);
      return;
    }

    const salesRef = collection(db, 'sales');
    const salesQuery = query(
      salesRef,
      where('storeId', '==', storeData.id)
    );

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        try {
          const salesData = snapshot.docs.map(doc => ({
            id: doc.id,
            documentId: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
            serverTimestamp: doc.data().serverTimestamp?.toDate()
          }));
          
          salesData.sort((a, b) => {
            const timeA = a.serverTimestamp || a.timestamp || new Date(0);
            const timeB = b.serverTimestamp || b.timestamp || new Date(0);
            return timeB - timeA;
          });
          
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
  }, [storeData.id, userRole]);
  
  // Filter sales based on search term and date
  useEffect(() => {
    let filtered = [...sales];

    if (selectedDate) {
      const selectedDateStart = new Date(selectedDate);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setDate(selectedDateEnd.getDate() + 1);

      filtered = filtered.filter(sale => {
        const saleDate = sale.timestamp;
        return saleDate >= selectedDateStart && saleDate < selectedDateEnd;
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
  }, [sales, searchTerm, selectedDate]);

  const fetchProductDetails = async (productId) => {
    try {
      const productDoc = await getDoc(doc(db, 'inventory', productId));
      if (productDoc.exists()) {
        setSelectedProduct(productDoc.data());
        setIsPopupOpen(true);
      } else {
        toast.error('Product details not found');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Error loading product details');
    }
  };

  const formatPayments = (payments) => {
    if (!payments || !Array.isArray(payments)) return 'N/A';
    return payments.map(p => `${p.method}: KES ${p.amount.toFixed(2)}`).join(', ');
  };

  const exportToCSV = () => {
    try {
      if (filteredSales.length === 0) {
        toast.warning('No data to export');
        return;
      }

      const headers = [
        'Document ID', 'Date', 'Brand', 'Product', 'Size', 'Quantity',
        'Original Price', 'Discounted Price', 'Total', 'Customer', 'Phone',
        'Payments', 'Discount Amount', 'Discount Percentage', 'Is Haggled'
      ];
      
      const csvData = filteredSales.map(sale => [
        sale.documentId || 'N/A',
        sale.timestamp?.toLocaleDateString() || 'N/A',
        sale.brand || 'N/A',
        sale.productName || 'N/A',
        sale.size || 'N/A',
        sale.quantity || 0,
        sale.originalPrice || 0,
        sale.price || 0,
        sale.total?.toFixed(2) || '0.00',
        sale.customerName || 'N/A',
        sale.customerPhone || 'N/A',
        formatPayments(sale.payments),
        sale.discountAmount || 0,
        sale.discountPercentage || 0,
        sale.isHaggled ? 'Yes' : 'No'
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
              <th className="p-3 text-right">Original Price</th>
              <th className="p-3 text-right">Discounted Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Payments</th>
              <th className="p-3 text-center">Haggled</th>
              <th className="p-3 text-center">Info</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center py-4">
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
                  <td className="p-3 text-right">KES {sale.originalPrice?.toFixed(2)}</td>
                  <td className="p-3 text-right">KES {sale.price?.toFixed(2)}</td>
                  <td className="p-3 text-right">KES {sale.total?.toFixed(2)}</td>
                  <td className="p-3">{sale.customerName || 'N/A'}</td>
                  <td className="p-3">{sale.customerPhone || 'N/A'}</td>
                  <td className="p-3">{formatPayments(sale.payments)}</td>
                  <td className="p-3 text-center">
                    {sale.isHaggled ? '✓' : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => fetchProductDetails(sale.productId)}
                      className={`hover:opacity-75 transition-opacity ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <Info size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductInfoPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        productData={selectedProduct}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ViewSales;