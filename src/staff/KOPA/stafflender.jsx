import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Search, Send, ArrowRight, AlertCircle } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, getDoc, addDoc, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import StaffNavbar from '../../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

const StaffLender = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchParams, setSearchParams] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [lendType, setLendType] = useState('pair'); // New state for pair/single selection
  const [lendQuantity, setLendQuantity] = useState(1);
  const [showLendModal, setShowLendModal] = useState(false);

  useEffect(() => {
    let unsubscribeTheme = initializeThemeListener(setIsDarkMode);
    let unsubscribeInventory = null;

    const setupData = async () => {
      try {
        const auth = getAuth();
        if (!auth.currentUser) {
          toast.error('Please sign in');
          setLoading(false);
          return;
        }

        // Fetch user data
        const userDoc = await getDoc(firestoreDoc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserRole(userData.role || 'staff');
        setUserLocation(userData.location || null);

        // Get store number from location
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

        if (!currentStoreId) {
          toast.error('Store location not found');
          setLoading(false);
          return;
        }

        // Fetch stores (excluding current store)
        const businessesSnapshot2 = await getDocs(collection(db, 'businesses'));
        const storesData = [];
        businessesSnapshot2.forEach(doc => {
          const locations = doc.data().locations || [];
          locations.forEach(location => {
            if (location !== userData.location) {
              storesData.push(location);
            }
          });
        });
        setStores(storesData);

        // Setup inventory listener with correct store ID
        const inventoryRef = collection(db, 'inventory');
        const inventoryQuery = query(inventoryRef, where('storeId', '==', currentStoreId));
        
        unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
          const inventoryData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sizes: Array.isArray(doc.data().sizes) ? doc.data().sizes : (doc.data().sizes || '').split(',').map(s => s.trim()).filter(Boolean),
            colors: Array.isArray(doc.data().colors) ? doc.data().colors : (doc.data().colors || '').split(',').map(c => c.trim()).filter(Boolean)
          }));
          setInventory(inventoryData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up data:', error);
        toast.error('Error loading data');
        setLoading(false);
      }
    };

    setupData();
    
    return () => {
      if (typeof unsubscribeTheme === 'function') unsubscribeTheme();
      if (typeof unsubscribeInventory === 'function') unsubscribeInventory();
    };
  }, []);

  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!selectedStore) return;
      
      try {
        const staffQuery = query(
          collection(db, 'users'),
          where('location', '==', selectedStore),
          where('role', 'in', ['staff', 'staff-admin'])
        );
        const staffSnapshot = await getDocs(staffQuery);
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStaffMembers(staffData);
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast.error('Error loading staff members');
      }
    };

    fetchStaffMembers();
  }, [selectedStore]);

  useEffect(() => {
    if (inventory.length > 0) {
      let filtered = inventory;
      
      if (searchParams.length > 0) {
        filtered = inventory.filter(item => {
          return searchParams.every(param => {
            const paramLower = param.toLowerCase().trim();
            return (
              item.atNo?.toLowerCase().includes(paramLower) ||
              item.name?.toLowerCase().includes(paramLower) ||
              item.brand?.toLowerCase().includes(paramLower) ||
              item.category?.toLowerCase().includes(paramLower) ||
              item.colors?.some(color => color.toLowerCase().includes(paramLower)) ||
              item.sizes?.some(size => size.toString().includes(paramLower))
            );
          });
        });
      }
      
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory([]);
    }
  }, [inventory, searchParams]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    const params = value.split('+').map(param => param.trim()).filter(param => param.length > 0);
    setSearchParams(params);
  };

  const handleLend = async () => {
    if (!selectedItem || !selectedStore || !selectedStaff || !lendType) {
      toast.error('Please select all required fields');
      return;
    }
  
    try {
      const auth = getAuth();
      const lentItem = {
        // Capture all relevant inventory attributes
        itemDetails: {
          id: selectedItem.id,
          atNo: selectedItem.atNo,
          name: selectedItem.name,
          brand: selectedItem.brand,
          category: selectedItem.category,
          gender: selectedItem.gender,
          ageGroup: selectedItem.ageGroup,
          colors: selectedItem.colors,
          sizes: selectedItem.sizes,
          price: selectedItem.price,
          storeId: selectedItem.storeId
        },
        fromStoreId: `store-${userLocation}`,
        toStoreId: selectedStore,
        fromStaffId: auth.currentUser.uid,
        toStaffId: selectedStaff,
        quantity: lendType === 'single' ? 1 : lendQuantity,
        type: lendType,
        status: 'lent',
        lentDate: new Date().toISOString(),
        notes: selectedItem.notes || ''
      };
  
      // Create lending record
      await addDoc(collection(db, 'lentshoes'), lentItem);
  
      // Update inventory based on lend type and existing incomplete pairs
      let newStock, newIncompletePairs;
  
      if (lendType === 'single') {
        if (selectedItem.incompletePairs > 0) {
          // If there's an existing incomplete pair, complete the pair by removing it
          newStock = selectedItem.stock - 1;
          newIncompletePairs = selectedItem.incompletePairs - 1;
        } else {
          // If no incomplete pairs exist, create a new incomplete pair
          newStock = selectedItem.stock;
          newIncompletePairs = selectedItem.incompletePairs + 1;
        }
      } else {
        // For full pairs, simply reduce the stock
        newStock = selectedItem.stock - lendQuantity;
        newIncompletePairs = selectedItem.incompletePairs;
      }
  
      await updateDoc(firestoreDoc(db, 'inventory', selectedItem.id), {
        stock: newStock,
        incompletePairs: newIncompletePairs
      });
  
      toast.success(`Item successfully lent as ${lendType}`);
      setShowLendModal(false);
      setSelectedItem(null);
      setSelectedStore('');
      setSelectedStaff('');
      setLendQuantity(1);
      setLendType('pair');
    } catch (error) {
      console.error('Error lending item:', error);
      toast.error('Error lending item');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Shoe Lending System
            </h1>
            {userLocation && (
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Store className="inline mr-2 mb-1" size={18} />
                {userLocation}
              </p>
            )}
          </div>
        </div>

        <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
                <input
                  type="text"
                  placeholder="Search inventory (e.g., @123 + red + 9.5)"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  }`}
                  value={searchInput}
                  onChange={handleSearchInput}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDarkMode ? 'border-white' : 'border-blue-500'
              }`} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                    <th className="p-3 text-left">@No</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Brand</th>
                    <th className="p-3 text-center">Available Pairs</th>
                    <th className="p-3 text-center">Incomplete</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t ${
                        isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <td className="p-3">{item.atNo}</td>
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.brand}</td>
                      <td className="p-3 text-center">{item.stock}</td>
                      <td className="p-3 text-center">{item.incompletePairs}</td>
                      <td className="p-3 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedItem(item);
                            setShowLendModal(true);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2"
                          disabled={item.stock === 0}
                        >
                          <Send size={16} />
                          Lend
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showLendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } rounded-lg p-6 max-w-md w-full mx-4`}
          >
            <h2 className="text-xl font-bold mb-4">Lend Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Selected Item</label>
                <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {selectedItem?.name} - {selectedItem?.atNo}
                </div>
              </div>

              <div>
                <label className="block mb-2">Select Store</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className={`w-full p-2 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'
                  }`}
                >
                  <option value="">Select Store</option>
                  {stores.map((store, index) => (
                    <option key={index} value={store}>{store}</option>
                  ))}
                </select>
              </div>

              {selectedStore && (
                <div>
                  <label className="block mb-2">Select Staff</label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className={`w-full p-2 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'
                    }`}
                  >
                    <option value="">Select Staff</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block mb-2">Lend Type</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setLendType('pair')}
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      lendType === 'pair'
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                  >
                    Pair
                  </button>
                  <button
                    onClick={() => setLendType('single')}
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      lendType === 'single'
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                  >
                    Single Shoe
                  </button>
                </div>
              </div>

              {lendType === 'pair' && (
                <div>
                  <label className="block mb-2">Quantity (Pairs)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.stock}
                    value={lendQuantity}
                    onChange={(e) => setLendQuantity(parseInt(e.target.value))}
                    className={`w-full p-2 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'
                    }`}
                  />
                </div>
              )}

              {lendType === 'single' && (
                <div className="mt-2 text-amber-500 flex items-center gap-2">
                  <AlertCircle size={16} />
                  This will create an incomplete pair in your inventory
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLendModal(false)}
                  className={`flex-1 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLend}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Confirm Lend
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

        {/* Lent Items History Section */}
        <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 mt-8`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Lending History
          </h2>
          <LendingHistory isDarkMode={isDarkMode} userLocation={userLocation} />
        </div>
      </div>
    </div>
  );
};

// Simplified Lending History Component without return functionality
const LendingHistory = ({ isDarkMode, userLocation }) => {
    const [lentItems, setLentItems] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchLendingHistory = async () => {
        try {
          const auth = getAuth();
          const lentQuery = query(
            collection(db, 'lentshoes'),
            where('fromStoreId', '==', `store-${userLocation}`),
            where('fromStaffId', '==', auth.currentUser.uid)
          );
  
          const unsubscribe = onSnapshot(lentQuery, async (snapshot) => {
            const items = [];
            for (const doc of snapshot.docs) {
              const data = doc.data();
              const toStaffDoc = await getDoc(firestoreDoc(db, 'users', data.toStaffId));
              const toStaffData = toStaffDoc.exists() ? toStaffDoc.data() : null;
              
              items.push({
                id: doc.id,
                ...data,
                toStaffName: toStaffData ? `${toStaffData.firstName} ${toStaffData.lastName}` : 'Unknown Staff'
              });
            }
            setLentItems(items.sort((a, b) => new Date(b.lentDate) - new Date(a.lentDate)));
            setLoading(false);
          });
  
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching lending history:', error);
          toast.error('Error loading lending history');
          setLoading(false);
        }
      };
  
      fetchLendingHistory();
    }, [userLocation]);
  
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">To Store</th>
              <th className="p-3 text-left">To Staff</th>
              <th className="p-3 text-center">Quantity</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {lentItems.map((item) => (
              <tr
                key={item.id}
                className={`border-t ${
                  isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                }`}
              >
                <td className="p-3">
                  {item.itemDetails.name}
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.itemDetails.atNo}
                  </div>
                </td>
                <td className="p-3">{item.toStoreId}</td>
                <td className="p-3">{item.toStaffName}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {new Date(item.lentDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {lentItems.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No lending history found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default StaffLender;