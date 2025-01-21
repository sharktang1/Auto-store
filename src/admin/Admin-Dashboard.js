import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ShoppingBag,
  CheckCircle
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../libs/firebase-config';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { getInitialTheme, initializeThemeListener } from '../utils/theme';

const DashboardCard = ({ title, value, icon: Icon, color, to }) => {
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

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [lentItems, setLentItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    return cleanup;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'lentshoes'), where('status', '==', 'lent'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLentItems(items);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateInventory = async (item) => {
    setIsUpdating(true);
    try {
      // Get the business document to verify the store location
      const businessesQuery = query(collection(db, 'businesses'));
      const businessesSnap = await getDocs(businessesQuery);
      
      // Find the business that has the target store location
      let targetBusinessId = null;
      let locationIndex = -1;
      
      businessesSnap.forEach(doc => {
        const businessData = doc.data();
        if (businessData.locations) {
          // Find the index of the location in the locations array
          const index = businessData.locations.indexOf(item.toStoreId);
          if (index !== -1) {
            targetBusinessId = doc.id;
            // Add 1 to make store IDs 1-based instead of 0-based
            locationIndex = index + 1;
          }
        }
      });
  
      if (!targetBusinessId || locationIndex === -1) {
        throw new Error('Invalid store location');
      }
  
      // Construct the correct store ID using the location index
      const targetStoreId = `store-${locationIndex}`;
  
      // Get the source inventory item
      const sourceInventoryRef = doc(db, 'inventory', item.itemId);
      const sourceInventorySnap = await getDoc(sourceInventoryRef);
      
      if (!sourceInventorySnap.exists()) {
        throw new Error('Source inventory item not found');
      }
  
      const sourceInventoryData = sourceInventorySnap.data();
  
      // Check if item exists in destination store
      const destinationQuery = query(
        collection(db, 'inventory'),
        where('storeId', '==', targetStoreId),
        where('atNo', '==', item.itemDetails.atNo)
      );
      const destinationSnap = await getDocs(destinationQuery);
  
      let destinationInventoryRef;
      
      if (destinationSnap.empty) {
        // Create new inventory item with correct store ID
        destinationInventoryRef = doc(collection(db, 'inventory'));
        await setDoc(destinationInventoryRef, {
          ...sourceInventoryData,
          storeId: targetStoreId,
          stock: item.quantity,
          incompletePairs: item.type === 'single' ? 1 : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing inventory item
        destinationInventoryRef = doc(db, 'inventory', destinationSnap.docs[0].id);
        const destinationData = destinationSnap.docs[0].data();
        
        await updateDoc(destinationInventoryRef, {
          stock: destinationData.stock + item.quantity,
          incompletePairs: item.type === 'single' 
            ? destinationData.incompletePairs + 1 
            : destinationData.incompletePairs,
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
  
  const userData = {
    username: "John Doe",
    email: "john@example.com",
    isAdmin: true
  };

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
            value="0000"
            icon={Package}
            color="bg-blue-500"
            to="/admin/inventory"
          />
          <DashboardCard
            title="Total Sales"
            value="ksh"
            icon={DollarSign}
            color="bg-green-500"
            to="/admin/sales"
          />
          <DashboardCard
            title="Active Staff"
            value="00"
            icon={Users}
            color="bg-purple-500"
            to="/admin/staff"
          />
          <DashboardCard
            title="Monthly Growth"
            value="+15%"
            icon={TrendingUp}
            color="bg-orange-500"
            to="/admin/stats"
          />
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;