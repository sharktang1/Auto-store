import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';

const ProductInfoPopup = ({ isOpen, onClose, productData, isDarkMode }) => {
  if (!productData) return null;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 400 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalVariants}
              className={`relative w-full max-w-lg rounded-lg p-6 ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className={`absolute right-4 top-4 p-1 rounded-full hover:bg-opacity-10 ${
                  isDarkMode ? 'hover:bg-white' : 'hover:bg-black'
                } transition-colors`}
              >
                <X size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Product Details: {productData.name}
                </h2>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-semibold">Category:</p>
                    <p>{productData.category || 'N/A'}</p>
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-semibold">Gender:</p>
                    <p>{productData.gender || 'N/A'}</p>
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-semibold">Age Group:</p>
                    <p>{productData.ageGroup || 'N/A'}</p>
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-semibold">AT Number:</p>
                    <p>{productData.atNo || 'N/A'}</p>
                  </div>
                </div>

                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-semibold">Colors:</p>
                  <p>{productData.colors?.join(', ') || 'N/A'}</p>
                </div>

                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-semibold">Available Sizes:</p>
                  <p>{productData.sizes?.join(', ') || 'N/A'}</p>
                </div>

                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-semibold">Current Stock:</p>
                  <p>{productData.stock || 0} pairs</p>
                </div>

                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-semibold">Notes:</p>
                  <p>{productData.notes || 'No notes available'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductInfoPopup;