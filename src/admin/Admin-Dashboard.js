import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ShoppingBag,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../libs/firebase-config';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { getInitialTheme, initializeThemeListener } from '../utils/theme';

const DashboardCard = ({ title, value, icon: Icon, color, to, trend }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={() => navigate(to)}
    >
      <div className={`p-6 rounded-lg shadow-md ${color} h-full`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white text-sm mb-1 opacity-90">{title}</p>
            <h3 className="text-white text-2xl font-bold">{value}</h3>
            {trend && (
              <div className="flex items-center text-xs mt-1">
                <span className={`mr-1 ${trend.startsWith('+') ? 'text-green-200' : 'text-red-200'}`}>
                  {trend}
                </span>
              </div>
            )}
          </div>
          <Icon className="text-white opacity-80" size={24} />
        </div>
      </div>
    </motion.div>
  );
};

const LentItem = ({ item, isDarkMode, onUpdateInventory, isUpdating }) => {
  const formattedDate = new Date(item.lentDate).toLocaleString();
  
  return (
    <motion.div 
      className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-4`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {item.itemDetails.name} - {item.itemDetails.brand}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AT No: {item.itemDetails.atNo}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            From: {item.fromStoreId} → To: {item.toStoreId}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Type: {item.type}, Quantity: {item.quantity}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Lent on: {formattedDate}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.status === 'lent' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
          }`}>
            {item.status}
          </span>
          {item.status === 'lent' && (
            <button
              onClick={() => onUpdateInventory(item)}
              disabled={isUpdating}
              className={`flex items-center space-x-1 px-3 py-1 ${
                isUpdating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded-md text-sm transition-colors`}
            >
              <CheckCircle size={16} />
              <span>{isUpdating ? 'Updating...' : 'Update Inventory'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ReturnItem = ({ item, isDarkMode, onCompleteReturn, isUpdating }) => {
  const formattedDate = new Date(item.returnDate).toLocaleString();
  
  return (
    <motion.div 
      className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-4`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {item.productName} - {item.brand}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Size: {item.size} | Quantity: {item.quantity}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Return Reason: {item.returnReason}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Returned on: {formattedDate}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={() => onCompleteReturn(item)}
            disabled={isUpdating}
            className={`flex items-center space-x-1 px-3 py-1 ${
              isUpdating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white rounded-md text-sm transition-colors`}
          >
            <RefreshCw size={16} />
            <span>{isUpdating ? 'Processing...' : 'Complete Return'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [lentItems, setLentItems] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalInventory: 0,
    totalSales: 0,
    activeStaff: 0,
    monthlyGrowth: '+0%'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    return cleanup;
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const inventoryQuery = query(collection(db, 'inventory'));
        const inventorySnapshot = await getCountFromServer(inventoryQuery);
        
        const salesQuery = query(collection(db, 'sales'));
        const salesSnapshot = await getCountFromServer(salesQuery);
        const salesData = await getDocs(salesQuery);
        const totalSalesAmount = salesData.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

        const staffQuery = query(collection(db, 'users'), where('role', 'in', ['staff', 'staff-admin']));
        const staffSnapshot = await getCountFromServer(staffQuery);

        setDashboardStats({
          totalInventory: inventorySnapshot.data().count,
          totalSales: totalSalesAmount,
          activeStaff: staffSnapshot.data().count,
          monthlyGrowth: '+15%'
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      }
    };

    fetchDashboardStats();

    const lentQuery = query(collection(db, 'lentshoes'), where('status', '==', 'lent'));
    const lentUnsubscribe = onSnapshot(lentQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLentItems(items);
    });

    const returnsQuery = query(collection(db, 'returns'), where('status', '==', 'processed'));
    const returnsUnsubscribe = onSnapshot(returnsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReturnItems(items);
    });

    return () => {
      lentUnsubscribe();
      returnsUnsubscribe();
    };
  }, []);

  const handleUpdateInventory = async (item) => {
    setIsUpdating(true);
    try {
      const storeLocationMap = {
        'Thika-ShopA': 'store-1',
        'Thika-ShopB': 'store-2'
      };
      
      const targetStoreId = storeLocationMap[item.toStoreId] || 
        (item.toStoreId.includes('ShopA') ? 'store-1' : 
         item.toStoreId.includes('ShopB') ? 'store-2' : 
         'store-1');
  
      const destinationQuery = query(
        collection(db, 'inventory'),
        where('storeId', '==', targetStoreId),
        where('atNo', '==', item.itemDetails.atNo),
        where('brand', '==', item.itemDetails.brand),
        where('name', '==', item.itemDetails.name),
        where('category', '==', item.itemDetails.category)
      );
  
      const destinationSnap = await getDocs(destinationQuery);
  
      // Additional client-side filtering for sizes and colors
      const matchingInventoryItems = destinationSnap.docs.filter(doc => {
        const inventoryData = doc.data();
        const hasSameSize = inventoryData.sizes.includes(item.itemDetails.sizes[0]);
        const hasSameColor = inventoryData.colors.includes(item.itemDetails.colors[0]);
        return hasSameSize && hasSameColor;
      });
  
      let destinationInventoryRef;
      
      if (matchingInventoryItems.length === 0) {
        // Create new inventory item
        destinationInventoryRef = doc(collection(db, 'inventory'));
        await setDoc(destinationInventoryRef, {
          ...item.itemDetails,
          storeId: targetStoreId,
          stock: item.quantity,
          incompletePairs: item.type === 'single' ? 1 : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing inventory item
        destinationInventoryRef = doc(db, 'inventory', matchingInventoryItems[0].id);
        const destinationData = matchingInventoryItems[0].data();
        
        await updateDoc(destinationInventoryRef, {
          stock: destinationData.stock + item.quantity,
          incompletePairs: item.type === 'single' 
            ? (destinationData.incompletePairs || 0) + 1 
            : (destinationData.incompletePairs || 0),
          updatedAt: serverTimestamp()
        });
      }
  
      // Update lentshoes status
      const lentShoeRef = doc(db, 'lentshoes', item.id);
      await updateDoc(lentShoeRef, {
        status: 'updated',
        updateDate: serverTimestamp()
      });
  
      toast.success('Inventory updated successfully');
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCompleteReturn = async (item) => {
    setIsUpdating(true);
    try {
      const inventoryDocRef = doc(db, 'inventory', item.productId);
      const inventorySnap = await getDoc(inventoryDocRef);
  
      if (!inventorySnap.exists()) {
        throw new Error('Inventory item not found');
      }
  
      const inventoryData = inventorySnap.data();
  
      if (inventoryData.storeId !== item.storeId) {
        throw new Error('Store mismatch for return');
      }
  
      await updateDoc(inventoryDocRef, {
        stock: inventoryData.stock + item.quantity,
        updatedAt: serverTimestamp()
      });
  
      if (item.originalSaleId) {
        await deleteDoc(doc(db, 'sales', item.originalSaleId));
      }
  
      await deleteDoc(doc(db, 'returns', item.id));
  
      toast.success('Return processed successfully');
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const userData = {
    username: "John Doe",
    email: "john@example.com",
    isAdmin: true
  };

 // (Previous code remains the same)

 return (
  <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
    <div className="fixed top-0 left-0 right-0 z-50">
      <Navbar
        username={userData.username}
        email={userData.email}
        isAdmin={userData.isAdmin}
      />
    </div>
    
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Inventory"
          value={dashboardStats.totalInventory.toString().padStart(4, '0')}
          icon={Package}
          color="bg-blue-500"
          to="/admin/inventory"
        />
        <DashboardCard
          title="Total Sales"
          value={`Ksh ${dashboardStats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
          to="/admin/sales"
        />
        <DashboardCard
          title="Active Staff"
          value={dashboardStats.activeStaff.toString().padStart(2, '0')}
          icon={Users}
          color="bg-purple-500"
          to="/admin/staff"
        />
        <DashboardCard
          title="Monthly Growth"
          value={dashboardStats.monthlyGrowth}
          icon={TrendingUp}
          color="bg-orange-500"
          to="/admin/stats"
          trend={dashboardStats.monthlyGrowth}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Inventory Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Inventory Updates
            </h2>
            <ShoppingBag className={isDarkMode ? 'text-white' : 'text-gray-600'} size={24} />
          </div>
          
          <div className="space-y-4">
            {lentItems.length === 0 ? (
              <p className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No pending inventory updates
              </p>
            ) : (
              lentItems.map(item => (
                <LentItem
                  key={item.id}
                  item={item}
                  isDarkMode={isDarkMode}
                  onUpdateInventory={handleUpdateInventory}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Returns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Returns
            </h2>
            <RefreshCw className={isDarkMode ? 'text-white' : 'text-gray-600'} size={24} />
          </div>
          
          <div className="space-y-4">
            {returnItems.length === 0 ? (
              <p className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No pending returns
              </p>
            ) : (
              returnItems.map(item => (
                <ReturnItem
                  key={item.id}
                  item={item}
                  isDarkMode={isDarkMode}
                  onCompleteReturn={handleCompleteReturn}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
};

export default Dashboard;