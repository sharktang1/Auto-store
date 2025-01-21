import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Store } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db , auth} from '../../libs/firebase-config';
import StaffNavbar from '../../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

const StaffReturn = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [processing, setProcessing] = useState(false);
  const [stores, setStores] = useState([]);
  const [storeData, setStoreData] = useState({ id: null, location: null, storeNumber: null });
  const [returnData, setReturnData] = useState({
    customerName: '',
    customerPhone: '',
    productName: '',
    saleDate: '',
    storeLocation: '',
    returnReason: ''
  });
  const [matchingSale, setMatchingSale] = useState(null);
  const [inventoryItem, setInventoryItem] = useState(null);

  useEffect(() => {
    const unsubscribeTheme = initializeThemeListener(setIsDarkMode);
    fetchStoreData();
    fetchAllStores();
    return unsubscribeTheme;
  }, []);

  const fetchStoreData = async () => {
    try {
      const businessesRef = collection(db, 'businesses');
      const businessesSnapshot = await getDocs(businessesRef);
      const firstBusiness = businessesSnapshot.docs[0];
      
      if (firstBusiness) {
        const locations = firstBusiness.data().locations || [];
        if (locations.length > 0) {
          setStoreData({
            id: `store-1`,
            location: locations[0],
            storeNumber: 1
          });
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Error loading store data');
    }
  };

  const fetchAllStores = async () => {
    try {
      const businessesRef = collection(db, 'businesses');
      const businessesSnapshot = await getDocs(businessesRef);
      let allStores = [];
      
      businessesSnapshot.docs.forEach(doc => {
        const locations = doc.data().locations || [];
        locations.forEach((location, index) => {
          allStores.push({
            id: `store-${index + 1}`,
            location: location,
            storeNumber: index + 1
          });
        });
      });
      
      setStores(allStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Error loading stores');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReturnData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const findSale = async () => {
    const requiredFields = ['customerPhone', 'productName'];
    const missingFields = requiredFields.filter(field => !returnData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please provide ${missingFields.join(' and ')}`);
      return;
    }

    try {
      const salesRef = collection(db, 'sales');
      let queryConditions = [
        where('customerPhone', '==', returnData.customerPhone),
        where('productName', '==', returnData.productName)
      ];

      if (returnData.storeLocation) {
        queryConditions.push(where('storeLocation', '==', returnData.storeLocation));
      }
      
      const q = query(salesRef, ...queryConditions);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('No matching sale found');
        return;
      }

      const sale = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };

      setMatchingSale(sale);
      setReturnData(prev => ({
        ...prev,
        customerName: sale.customerName || prev.customerName,
        storeLocation: sale.storeLocation || prev.storeLocation,
      }));

      // Find matching inventory item
      const inventoryRef = collection(db, 'inventory');
      const inventoryQ = query(
        inventoryRef,
        where('productName', '==', returnData.productName),
        where('storeId', '==', sale.storeId)
      );

      const inventorySnapshot = await getDocs(inventoryQ);
      if (!inventorySnapshot.empty) {
        setInventoryItem({
          id: inventorySnapshot.docs[0].id,
          ...inventorySnapshot.docs[0].data()
        });
      }
    } catch (error) {
      console.error('Error finding sale:', error);
      toast.error('Error searching for sale');
    }
  };

  const handleReturn = async () => {
    if (!matchingSale || !returnData.returnReason) {
      toast.error('Please provide all required information');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create return document
      const returnRef = collection(db, 'returns');
      const returnDoc = await addDoc(returnRef, {
        saleId: matchingSale.id,
        productId: matchingSale.productId,  
        storeId: matchingSale.storeId,
        customerName: matchingSale.customerName,
        customerPhone: matchingSale.customerPhone,
        productName: matchingSale.productName,
        returnReason: returnData.returnReason,
        processedBy: auth.currentUser.uid,
        returnDate: Timestamp.now(),
        originalSaleDate: matchingSale.timestamp,
        price: matchingSale.price,
        size: matchingSale.size,
        brand: matchingSale.brand
      });

      // 2. Update inventory if needed
      if (inventoryItem) {
        const updatedStock = (inventoryItem.stock || 0) + 1;
        await updateDoc(doc(db, 'inventory', inventoryItem.id), {
          stock: updatedStock
        });
      }

      // 3. Delete the original sale
      await deleteDoc(doc(db, 'sales', matchingSale.id));

      toast.success('Return processed successfully');
      // Reset form
      setReturnData({
        customerName: '',
        customerPhone: '',
        productName: '',
        saleDate: '',
        storeLocation: '',
        returnReason: ''
      });
      setMatchingSale(null);
      setInventoryItem(null);
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Error processing return');
    } finally {
      setProcessing(false);
    }
  };

  const inputClasses = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 placeholder-gray-500'
  }`;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Process Returns
            </h1>
            {storeData.location && (
              <div className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="flex items-center">
                  <Store className="inline mr-2 mb-1" size={18} />
                  {storeData.location}
                </p>
                <p className="text-sm opacity-75 ml-6">Store #{storeData.storeNumber}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`w-full max-w-4xl mx-auto rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-6`}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={returnData.customerName}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Customer Phone *
                </label>
                <input
                  type="text"
                  name="customerPhone"
                  value={returnData.customerPhone}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Enter customer phone"
                />
              </div>
              <div>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={returnData.productName}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Sale Date
                </label>
                <input
                  type="date"
                  name="saleDate"
                  value={returnData.saleDate}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Store Location
                </label>
                <select
                  name="storeLocation"
                  value={returnData.storeLocation}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  <option value="">Select Store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.location}>
                      {store.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={findSale}
                disabled={!returnData.customerPhone || !returnData.productName || processing}
                className={`flex items-center px-6 py-2 rounded-lg ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <Search size={20} className="mr-2" />
                Find Sale
              </button>
            </div>

            {matchingSale && (
              <div className={`mt-6 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sale Details
                </h3>
                <div className={`grid grid-cols-2 gap-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <p><span className="opacity-75">Customer:</span> {matchingSale.customerName}</p>
                  <p><span className="opacity-75">Phone:</span> {matchingSale.customerPhone}</p>
                  <p><span className="opacity-75">Product:</span> {matchingSale.productName}</p>
                  <p><span className="opacity-75">Size:</span> {matchingSale.size}</p>
                  <p><span className="opacity-75">Price:</span> KES {matchingSale.price}</p>
                  <p><span className="opacity-75">Store:</span> {matchingSale.storeLocation}</p>
                  <p><span className="opacity-75">Date:</span> {matchingSale.timestamp?.toDate().toLocaleDateString()}</p>
                  <p><span className="opacity-75">Brand:</span> {matchingSale.brand}</p>
                </div>

                <div className="mt-4">
                  <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Return Reason *
                  </label>
                  <textarea
                    name="returnReason"
                    value={returnData.returnReason}
                    onChange={handleInputChange}
                    className={`${inputClasses} min-h-[100px]`}
                    placeholder="Enter reason for return..."
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleReturn}
                    disabled={processing || !returnData.returnReason}
                    className={`flex items-center px-6 py-2 rounded-lg ${
                      processing || !returnData.returnReason
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    <RotateCcw size={20} className="mr-2" />
                    {processing ? 'Processing...' : 'Process Return'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffReturn;