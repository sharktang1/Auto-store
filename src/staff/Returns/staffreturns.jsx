import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import StaffNavbar from '../../components/StaffNavbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  addDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const StaffReturns = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [formData, setFormData] = useState({
    productName: '',
    size: '',
    saleDate: ''
  });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const findSale = async () => {
    setLoading(true);
    setSaleDetails(null);
  
    if (!formData.productName || !formData.size || !formData.saleDate) {
      toast.error('Please fill in product name, size, and sale date');
      setLoading(false);
      return;
    }
  
    try {
      const db = getFirestore();
      const salesRef = collection(db, 'sales');
  
      const salesQuery = query(
        salesRef, 
        where('productName', '==', formData.productName),
        where('size', '==', formData.size)
      );
  
      const salesSnapshot = await getDocs(salesQuery);
  
      const matchingSales = salesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(sale => {
          const saleDate = new Date(sale.timestamp.seconds * 1000);
          const selectedDate = new Date(formData.saleDate);
          return saleDate.toDateString() === selectedDate.toDateString();
        });
  
      if (matchingSales.length > 0) {
        setSaleDetails(matchingSales[0]);
      } else {
        toast.error('No matching sale found');
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
      setFormData({ productName: '', size: '', saleDate: '' });
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
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Product Name
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter Product Name"
              />
            </div>
            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter Size"
              />
            </div>
            <div>
              <label className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sale Date
              </label>
              <input
                type="date"
                name="saleDate"
                value={formData.saleDate}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
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