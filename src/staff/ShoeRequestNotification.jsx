import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, X } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const ShoeRequestNotification = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    shoeName: '',
    size: '',
    quantity: '',
    customerContact: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const db = getFirestore();
      
      await addDoc(collection(db, 'notifications'), {
        ...formData,
        type: 'shoe_request',
        status: 'pending',
        storeId: auth.currentUser?.uid,
        staffId: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });

      setFormData({
        shoeName: '',
        size: '',
        quantity: '',
        customerContact: ''
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className={`mb-4 p-6 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Record Requested Shoe
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  name="shoeName"
                  value={formData.shoeName}
                  onChange={handleInputChange}
                  placeholder="Shoe Name/Model"
                  className={`w-full p-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  required
                />
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="Size"
                  className={`w-full p-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  required
                />
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Quantity"
                  className={`w-full p-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  required
                />
                <input
                  type="text"
                  name="customerContact"
                  value={formData.customerContact}
                  onChange={handleInputChange}
                  placeholder="Customer Contact (Optional)"
                  className={`w-full p-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-4 p-2 rounded bg-blue-500 text-white font-medium
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </motion.button>
            </form>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-2 bg-green-500 text-white rounded text-center"
                >
                  Request submitted successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {isOpen ? (
          <X className={isDarkMode ? 'text-white' : 'text-gray-900'} size={24} />
        ) : (
          <Plus className={isDarkMode ? 'text-white' : 'text-gray-900'} size={24} />
        )}
      </motion.button>
    </div>
  );
};

export default ShoeRequestNotification;