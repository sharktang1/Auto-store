import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, AlertCircle, Info, Download } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const StaffInventoryView = ({ onEditItem, isDarkMode, onInventoryUpdate }) => {
  const [inventory, setInventory] = useState([]);
  const [searchParams, setSearchParams] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStockInfo, setShowStockInfo] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [userRole, setUserRole] = useState('staff');

  useEffect(() => {
    let unsubscribe = null;

    const initializeInventory = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        
        if (!auth.currentUser) {
          throw new Error('Please sign in to view inventory');
        }

        // Get user data and role
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        setUserRole(userData.role || 'staff');

        // Find store ID based on user location
        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesRef);
        
        let currentStoreId = null;
        for (const doc of businessesSnapshot.docs) {
          const locations = doc.data().locations || [];
          const locationIndex = locations.findIndex(loc => loc === userData.location);
          if (locationIndex !== -1) {
            currentStoreId = `store-${locationIndex + 1}`;
            break;
          }
        }

        if (!currentStoreId && userData.role !== 'admin') {
          throw new Error('Store location not found');
        }

        setStoreId(currentStoreId);

        // Set up real-time inventory listener
        const inventoryRef = collection(db, 'inventory');
        const storeQuery = query(inventoryRef, where('storeId', '==', currentStoreId));
        
        unsubscribe = onSnapshot(storeQuery, (snapshot) => {
          const inventoryData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sizes: Array.isArray(doc.data().sizes) 
              ? doc.data().sizes 
              : (doc.data().sizes || '').split(',').map(s => s.trim()).filter(Boolean),
            colors: Array.isArray(doc.data().colors) 
              ? doc.data().colors 
              : (doc.data().colors || '').split(',').map(c => c.trim()).filter(Boolean),
            incompletePairs: doc.data().incompletePairs || 0,
            notes: doc.data().notes || ''
          }));

          // Apply search filtering
          let filtered = inventoryData;
          if (searchParams.length > 0) {
            filtered = filtered.filter(item => {
              return searchParams.every(param => {
                const paramLower = param.toLowerCase().trim();
                return (
                  item.atNo?.toLowerCase().includes(paramLower) ||
                  item.name?.toLowerCase().includes(paramLower) ||
                  item.brand?.toLowerCase().includes(paramLower) ||
                  item.category?.toLowerCase().includes(paramLower) ||
                  item.colors?.some(color => color.toLowerCase().includes(paramLower)) ||
                  item.sizes?.some(size => size.toString().includes(paramLower)) ||
                  item.gender?.toLowerCase().includes(paramLower) ||
                  item.ageGroup?.toLowerCase().includes(paramLower)
                );
              });
            });
          }
          
          setInventory(filtered);
          setError(null);
        }, (err) => {
          console.error('Error fetching inventory:', err);
          setError('Failed to load inventory');
        });

      } catch (err) {
        console.error('Error initializing inventory:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeInventory();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [searchParams]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    const params = value.split('+').map(param => param.trim()).filter(param => param.length > 0);
    setSearchParams(params);
  };

  const calculateTotalShoes = (item) => {
    const completePairs = item.stock - item.incompletePairs;
    return (completePairs * 2) + parseInt(item.incompletePairs);
  };

  const exportToCSV = () => {
    try {
      const headers = [
        '@No', 'Product Name', 'Brand', 'Category', 'Price',
        'Total Pairs', 'Complete Pairs', 'Incomplete Pairs',
        'Total Shoes', 'Sizes', 'Colors', 'Notes'
      ];

      const csvData = inventory.map(item => [
        item.atNo, item.name, item.brand, item.category, item.price,
        item.stock, item.stock - item.incompletePairs, item.incompletePairs,
        calculateTotalShoes(item), item.sizes.join(', '), 
        item.colors.join(', '), item.notes
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = URL.createObjectURL(blob);
      link.download = `store_inventory_${date}.csv`;
      link.click();
    } catch (err) {
      setError('Failed to export inventory');
      console.error(err);
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
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
              placeholder="Search by multiple parameters using + (e.g., @123 + red + 9.5)"
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              value={searchInput}
              onChange={handleSearchInput}
            />
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Use + to combine search parameters (e.g., @No + Color + Size)
          </p>
        </div>

        <div className="flex gap-4">
          <div 
            className="relative" 
            onMouseEnter={() => setShowStockInfo(true)}
            onMouseLeave={() => setShowStockInfo(false)}
          >
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Info size={20} />
              Stock Info
            </button>
            {showStockInfo && (
              <div className={`absolute right-0 mt-2 p-4 rounded-lg shadow-lg z-10 w-80 ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
              }`}>
                <h4 className="font-semibold mb-2">Understanding Stock Numbers:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Total Pairs: All pairs in inventory (complete + incomplete)</li>
                  <li>• Complete Pairs: Pairs with both left and right shoes</li>
                  <li>• Incomplete Pairs: Pairs missing one shoe</li>
                  <li>• Total Shoes: Complete pairs × 2 + Incomplete pairs</li>
                </ul>
              </div>
            )}
          </div>

          {userRole === 'staff-admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToCSV}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
              } hover:opacity-90`}
            >
              <Download size={20} />
              Export CSV
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-12 w-full rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                <th className="p-3 text-left">@No</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Total Pairs</th>
                <th className="p-3 text-right">Complete</th>
                <th className="p-3 text-right">Incomplete</th>
                <th className="p-3 text-center">Total Shoes</th>
                <th className="p-3 text-center">Sizes</th>
                <th className="p-3 text-center">Colors</th>
                {userRole === 'staff-admin' && <th className="p-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'staff-admin' ? 12 : 11} className="text-center p-4">
                    No items found
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
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
                    <td className="p-3 text-right">{item.stock}</td>
                    <td className="p-3 text-right">{item.stock - item.incompletePairs}</td>
                    <td className="p-3 text-right">
                      {item.incompletePairs > 0 ? (
                        <span className="text-amber-500">{item.incompletePairs}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-3 text-center">{calculateTotalShoes(item)}</td>
                    <td className="p-3 text-center">{item.sizes.join(', ')}</td>
                    <td className="p-3 text-center">{item.colors.join(', ')}</td>
                    {userRole === 'staff-admin' && (
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onEditItem(item)}
                            className="p-1 text-blue-500 hover:text-blue-600"
                            title="Edit item"
                          >
                            <Edit size={18} />
                          </motion.button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffInventoryView;