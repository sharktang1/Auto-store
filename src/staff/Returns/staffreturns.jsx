import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import StaffNavbar from '../../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { 
  getFirestore, 
  collection, 
  doc,
  getDoc,
  addDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const StaffReturns = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [saleId, setSaleId] = useState('');
  const [saleDetails, setSaleDetails] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnOptions, setReturnOptions] = useState([
    'Defective Product',
    'Wrong Size',
    'Doesn\'t Fit',
    'Changed Mind',
    'Other'
  ]);
  const [selectedReturnOption, setSelectedReturnOption] = useState('');

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    return cleanup;
  }, []);

  const findSale = async () => {
    setLoading(true);
    setSaleDetails(null);
  
    if (!saleId.trim()) {
      toast.error('Please enter a sale ID');
      setLoading(false);
      return;
    }
  
    try {
      const db = getFirestore();
      const saleRef = doc(db, 'sales', saleId.trim());
      const saleSnap = await getDoc(saleRef);
  
      if (saleSnap.exists()) {
        setSaleDetails({ id: saleSnap.id, ...saleSnap.data() });
      } else {
        toast.error('No sale found with this ID');
      }
    } catch (error) {
      console.error('Error finding sale:', error);
      toast.error('Error finding sale');
    } finally {
      setLoading(false);
    }
  };

  const processReturn = async () => {
    if (!saleDetails) {
      toast.error('No sale selected');
      return;
    }

    const finalReturnReason = selectedReturnOption === 'Other' 
      ? returnReason 
      : selectedReturnOption;

    if (!finalReturnReason) {
      toast.error('Please select or enter a return reason');
      return;
    }

    try {
      const db = getFirestore();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      const returnData = {
        originalSaleId: saleDetails.id,
        productId: saleDetails.productId,
        productName: saleDetails.productName,
        size: saleDetails.size,
        
        originalPrice: saleDetails.originalPrice,
        price: saleDetails.price,
        discountAmount: saleDetails.discountAmount || 0,
        discountPercentage: saleDetails.discountPercentage,
        total: saleDetails.total,
        
        brand: saleDetails.brand,
        storeId: saleDetails.storeId,
        storeLocation: saleDetails.storeLocation,
        quantity: saleDetails.quantity,
        
        returnDate: new Date().toISOString(),
        returnReason: finalReturnReason,
        staffId: currentUser.uid,
        status: 'processed',
        
        originalSaleTimestamp: saleDetails.timestamp
      };

      if (saleDetails.customerName) returnData.customerName = saleDetails.customerName;
      if (saleDetails.customerPhone) returnData.customerPhone = saleDetails.customerPhone;
      if (saleDetails.paymentMethod) returnData.paymentMethod = saleDetails.paymentMethod;

      await addDoc(collection(db, 'returns'), returnData);

      toast.success('Return processed successfully');
      
      // Reset form
      setSaleId('');
      setSaleDetails(null);
      setReturnReason('');
      setSelectedReturnOption('');
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Error processing return');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <StaffNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Product Returns
        </h1>

        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="mb-4">
            <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sale ID
            </label>
            <input
              type="text"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Enter Sale ID"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={findSale}
            disabled={loading}
            className={`w-full py-3 rounded-lg mb-4 ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Searching...' : 'Find Sale'}
          </motion.button>

          {saleDetails && (
            <div className="mt-4">
              <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sale Details
                </h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Product: {saleDetails.productName}
                  <br />
                  Size: {saleDetails.size}
                  <br />
                  Total: ${saleDetails.total}
                  <br />
                  Date: {new Date(saleDetails.timestamp.seconds * 1000).toLocaleDateString()}
                </p>
              </div>

              <div className="mb-4">
                <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Return Reason
                </label>
                <select
                  value={selectedReturnOption}
                  onChange={(e) => setSelectedReturnOption(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select Return Reason</option>
                  {returnOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {selectedReturnOption === 'Other' && (
                <textarea
                  placeholder="Specify other return reason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className={`w-full p-3 mb-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                />
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={processReturn}
                className={`w-full py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                Complete Return
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffReturns;