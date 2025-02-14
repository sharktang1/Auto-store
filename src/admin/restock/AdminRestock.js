import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle,
  Filter,
  Store,
  Download
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config.mjs';
import Navbar from '../../components/Navbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';

const StockLevelCard = ({ title, count, icon: Icon, color, onClick, isSelected }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`cursor-pointer ${isSelected ? 'ring-2 ring-offset-2' : ''} ${color}`}
  >
    <div className="p-6 rounded-lg shadow-md h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white text-sm mb-1 opacity-90">{title}</p>
          <h3 className="text-white text-2xl font-bold">{count}</h3>
        </div>
        <Icon className="text-white opacity-80" size={24} />
      </div>
    </div>
  </motion.div>
);

const AdminRestock = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [highStockThreshold, setHighStockThreshold] = useState(50);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState('all');
  const [stores, setStores] = useState([]);
  const [stockCounts, setStockCounts] = useState({
    low: 0,
    medium: 0,
    high: 0,
    outOfStock: 0
  });

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    fetchStores();
    return cleanup;
  }, []);

  const fetchStores = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;

      const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
      if (!businessDoc.exists()) return;

      const businessData = businessDoc.data();
      const storeLocations = businessData.locations || [];
      
      setStores(storeLocations.map((location, index) => ({
        id: `store-${index + 1}`,
        name: `${businessData.businessName} - ${location}`,
        location
      })));
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const calculateTotalShoes = (item) => {
    const completePairs = item.stock - (item.incompletePairs || 0);
    return (completePairs * 2) + parseInt(item.incompletePairs || 0);
  };

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      let stockQuery;
      
      if (selectedFilter === 'outOfStock') {
        stockQuery = query(
          collection(db, 'inventory'),
          where('stock', '==', 0)
        );
      } else if (selectedFilter === 'low') {
        stockQuery = query(
          collection(db, 'inventory'),
          where('stock', '>', 0),
          where('stock', '<=', lowStockThreshold)
        );
      } else if (selectedFilter === 'medium') {
        stockQuery = query(
          collection(db, 'inventory'),
          where('stock', '>', lowStockThreshold),
          where('stock', '<=', highStockThreshold)
        );
      } else if (selectedFilter === 'high') {
        stockQuery = query(
          collection(db, 'inventory'),
          where('stock', '>', highStockThreshold)
        );
      }

      if (stockQuery) {
        const snapshot = await getDocs(stockQuery);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filteredItems = selectedStore === 'all' 
          ? items 
          : items.filter(item => item.storeId === selectedStore);

        setInventoryData(filteredItems);

        const counts = {
          outOfStock: filteredItems.filter(item => item.stock === 0).length,
          low: filteredItems.filter(item => item.stock > 0 && item.stock <= lowStockThreshold).length,
          medium: filteredItems.filter(item => item.stock > lowStockThreshold && item.stock <= highStockThreshold).length,
          high: filteredItems.filter(item => item.stock > highStockThreshold).length
        };

        setStockCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFilter) {
      fetchInventoryData();
    }
  }, [selectedFilter, lowStockThreshold, highStockThreshold, selectedStore]);

  const getStockLevelColor = (stock) => {
    if (stock === 0) return 'text-red-500';
    if (stock <= lowStockThreshold) return 'text-amber-500';
    if (stock <= highStockThreshold) return 'text-blue-500';
    return 'text-green-500';
  };

  const exportToCSV = () => {
    if (!inventoryData.length) return;

    const headers = [
      '@No',
      'Product Name',
      'Brand',
      'Category',
      'Price',
      'Current Stock',
      'Complete Pairs',
      'Incomplete Pairs',
      'Total Shoes',
      'Sizes',
      'Colors',
      'Age Group',
      'Gender',
      'Stock Level',
      'Notes'
    ];

    const csvData = inventoryData.map(item => [
      item.atNo,
      item.name,
      item.brand,
      item.category,
      item.price,
      item.stock,
      item.stock - (item.incompletePairs || 0),
      item.incompletePairs || 0,
      calculateTotalShoes(item),
      Array.isArray(item.sizes) ? item.sizes.join(', ') : '',
      Array.isArray(item.colors) ? item.colors.join(', ') : '',
      item.ageGroup || '',
      item.gender || '',
      item.stock === 0 ? 'Out of Stock' :
        item.stock <= lowStockThreshold ? 'Low' :
        item.stock <= highStockThreshold ? 'Medium' : 'High',
      item.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `restock_report_${date}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Stock Level Management
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Monitor and manage inventory stock levels across stores
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Store className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} size={20} />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border appearance-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StockLevelCard
            title="Out of Stock"
            count={stockCounts.outOfStock}
            icon={MinusCircle}
            color="bg-red-500"
            onClick={() => setSelectedFilter('outOfStock')}
            isSelected={selectedFilter === 'outOfStock'}
          />
          <StockLevelCard
            title="Low Stock"
            count={stockCounts.low}
            icon={TrendingDown}
            color="bg-amber-500"
            onClick={() => setSelectedFilter('low')}
            isSelected={selectedFilter === 'low'}
          />
          <StockLevelCard
            title="Medium Stock"
            count={stockCounts.medium}
            icon={Filter}
            color="bg-blue-500"
            onClick={() => setSelectedFilter('medium')}
            isSelected={selectedFilter === 'medium'}
          />
          <StockLevelCard
            title="High Stock"
            count={stockCounts.high}
            icon={TrendingUp}
            color="bg-green-500"
            onClick={() => setSelectedFilter('high')}
            isSelected={selectedFilter === 'high'}
          />
        </div>

        <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 mb-6`}>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div className="flex-1">
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                High Stock Threshold
              </label>
              <input
                type="number"
                value={highStockThreshold}
                onChange={(e) => setHighStockThreshold(Number(e.target.value))}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                disabled={!inventoryData.length}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  !inventoryData.length
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                <Download size={20} />
                Export Report
              </motion.button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : inventoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                    <th className="p-3 text-left">@No</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Brand</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Complete</th>
                    <th className="p-3 text-right">Incomplete</th>
                    <th className="p-3 text-center">Total Shoes</th>
                    <th className="p-3 text-center">Sizes</th>
                    <th className="p-3 text-center">Colors</th>
                    <th className="p-3 text-center">Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-t ${
                        isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <td className="p-3">{item.atNo}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          {item.name}
                          {item.incompletePairs > 0 && (
                            <AlertCircle
                              size={16}
                              className="ml-2 text-amber-500"
                              title={`${item.incompletePairs} pairs missing one shoe`}
                            />
                          )}
                        </div>
                        {item.notes && (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{item.brand}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right">${item.price}</td>
                      <td className={`p-3 text-right ${getStockLevelColor(item.stock)}`}>
                        {item.stock}
                      </td>
                      <td className="p-3 text-right">{item.stock - (item.incompletePairs || 0)}</td>
                      <td className="p-3 text-right">
                        {item.incompletePairs > 0 ? (
                          <span className="text-amber-500">{item.incompletePairs}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 text-center">{calculateTotalShoes(item)}</td>
                      <td className="p-3 text-center">{Array.isArray(item.sizes) ? item.sizes.join(', ') : ''}</td>
                      <td className="p-3 text-center">{Array.isArray(item.colors) ? item.colors.join(', ') : ''}</td>
                      <td className="p-3 text-center">
                        {item.stock === 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        )}
                        {item.stock > 0 && item.stock <= lowStockThreshold && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                        {item.stock > lowStockThreshold && item.stock <= highStockThreshold && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Medium Stock
                          </span>
                        )}
                        {item.stock > highStockThreshold && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            High Stock
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedFilter ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No items found for the selected stock level
            </div>
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Select a stock level category to view inventory items
            </div>
          )}
        </div>

        {stockCounts.outOfStock > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded"
          >
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <div>
                <p className="text-red-700 font-medium">
                  Warning: {stockCounts.outOfStock} items are currently out of stock
                </p>
                <p className="text-red-600 text-sm">
                  Click on the "Out of Stock" card above to view these items and take action.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminRestock;