// LendItems.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Store } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const LendItems = ({ isDarkMode }) => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchParams, setSearchParams] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [lendType, setLendType] = useState('pair');
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
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
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        setUserLocation(userData.location);
        
        // Fetch businesses
        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesRef);
        const businessesData = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBusinesses(businessesData);

        // Fetch stores
        let allStores = [];
        businessesData.forEach(business => {
          business.locations?.forEach((location, index) => {
            allStores.push({
              id: `${business.id}-store-${index + 1}`,
              businessId: business.id,
              location: location,
              businessName: business.businessName
            });
          });
        });
        setStores(allStores);
        
        // Set current store ID
        const currentStore = allStores.find(store => store.location === userData.location);
        setStoreId(currentStore?.id);

        // Fetch staff members
        const staffQuery = query(collection(db, 'users'), 
          where('role', 'in', ['staff', 'staff-admin']));
        const staffSnapshot = await getDocs(staffQuery);
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStaffMembers(staffData);

        // Setup inventory listener
        if (currentStore?.id) {
          const inventoryRef = collection(db, 'inventory');
          const inventoryQuery = query(inventoryRef, where('storeId', '==', currentStore.id));
          
          unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setInventory(inventoryData);
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error setting up data:', error);
        toast.error('Error loading data');
        setLoading(false);
      }
    };

    setupData();

    return () => {
      if (unsubscribeInventory) unsubscribeInventory();
    };
  }, []);

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

  const handleLendItem = async () => {
    if (!selectedItem || !selectedStore || !selectedStaff || !lendType) {
      toast.error('Please select item, destination store, staff member, and lend type');
      return;
    }

    if (selectedItem.stock < (lendType === 'pair' ? 1 : 0.5)) {
      toast.error('Insufficient stock for selected lend type');
      return;
    }

    try {
      const auth = getAuth();
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      const destinationStore = stores.find(s => s.id === selectedStore);
      const destinationStaff = staffMembers.find(s => s.id === selectedStaff);

      // Create lent shoe record
      await addDoc(collection(db, 'lentshoes'), {
        itemId: selectedItem.id,
        atNo: selectedItem.atNo,
        name: selectedItem.name,
        fromStoreId: storeId,
        fromStoreName: userLocation,
        fromStaffId: auth.currentUser.uid,
        fromStaffName: userData.username,
        toStoreId: selectedStore,
        toStoreName: destinationStore?.location,
        toStaffId: destinationStaff.id,
        toStaffName: destinationStaff.username,
        lendType: lendType,
        lentDate: serverTimestamp(),
        status: 'lent'
      });

      // Update source store inventory
      const sourceItemRef = doc(db, 'inventory', selectedItem.id);
      await updateDoc(sourceItemRef, {
        stock: selectedItem.stock - (lendType === 'pair' ? 1 : 0.5),
        incompletePairs: lendType === 'single' ? 
          (selectedItem.incompletePairs || 0) + 1 : 
          (selectedItem.incompletePairs || 0)
      });

      // Update destination store inventory
      const destInventoryRef = collection(db, 'inventory');
      const destQuery = query(destInventoryRef, 
        where('atNo', '==', selectedItem.atNo),
        where('storeId', '==', selectedStore));
      
      const destSnapshot = await getDocs(destQuery);
      
      if (destSnapshot.empty) {
        const { id, ...newItem } = selectedItem;
        await addDoc(destInventoryRef, {
          ...newItem,
          storeId: selectedStore,
          stock: lendType === 'pair' ? 1 : 0.5,
          incompletePairs: lendType === 'single' ? 1 : 0
        });
      } else {
        const destDoc = destSnapshot.docs[0];
        await updateDoc(doc(db, 'inventory', destDoc.id), {
          stock: destDoc.data().stock + (lendType === 'pair' ? 1 : 0.5),
          incompletePairs: lendType === 'single' ? 
            (destDoc.data().incompletePairs || 0) + 1 : 
            (destDoc.data().incompletePairs || 0)
        });
      }

      toast.success('Item successfully lent');
      setSelectedItem(null);
      setSelectedStore('');
      setSelectedStaff('');
      setLendType('pair');
    } catch (error) {
      console.error('Error lending item:', error);
      toast.error('Error lending item');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      {userLocation && (
        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <Store className="inline mr-2 mb-1" size={18} />
          {userLocation}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-2">
          <div className={`relative flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
            <input
              type="text"
              placeholder="Search items (e.g., @123 + red + 9.5)"
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

        <div>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select destination store</option>
            {stores
              .filter(store => store.id !== storeId)
              .map(store => (
                <option key={store.id} value={store.id}>
                  {store.businessName} - {store.location}
                </option>
              ))
            }
          </select>
        </div>

        <div>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select staff member</option>
            {staffMembers.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.username} - {staff.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setLendType('pair')}
          className={`px-4 py-2 rounded-lg ${
            lendType === 'pair'
              ? 'bg-blue-500 text-white'
              : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          Lend Pair
        </button>
        <button
          onClick={() => setLendType('single')}
          className={`px-4 py-2 rounded-lg ${
            lendType === 'single'
              ? 'bg-blue-500 text-white'
              : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          Lend Single Shoe
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
        <thead>
            <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <th className="p-3 text-left">@No</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-center">Complete Pairs</th>
              <th className="p-3 text-center">Incomplete Pairs</th>
              <th className="p-3 text-center">Action</th>
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
                <td className="p-3 text-center">{Math.floor(item.stock)}</td>
                <td className="p-3 text-center">{item.incompletePairs || 0}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className={`px-4 py-1 rounded ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-500 text-white'
                        : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                    }`}
                    disabled={item.stock <= 0}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className={`mt-6 flex justify-between items-center p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
        }`}>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Selected Item: {selectedItem.name}
            </h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              @No: {selectedItem.atNo} | Brand: {selectedItem.brand} | 
              Lending: {lendType === 'pair' ? 'Complete Pair' : 'Single Shoe'}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLendItem}
            disabled={!selectedStore || !selectedStaff}
            className={`flex items-center px-6 py-2 rounded-lg ${
              !selectedStore || !selectedStaff
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <ArrowRight size={20} className="mr-2" />
            Lend Item
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default LendItems;

