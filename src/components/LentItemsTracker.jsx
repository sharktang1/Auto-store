import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  X,
  CheckCircle,
  Tag,
  Package,
  Calendar,
  Store,
  Users,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../libs/firebase-config';

const LentItemsTracker = ({ isDarkMode }) => {
  const [lentItems, setLentItems] = useState([]);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  useEffect(() => {
    const fetchLentItems = async () => {
      try {
        const lentQuery = query(collection(db, 'lentshoes'), where('status', '==', 'lent'));
        const unsubscribe = onSnapshot(lentQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLentItems(items);

          if (items.length > 0) {
            toast.info(`${items.length} Pending Lent Items`, {
              position: "bottom-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching lent items:', error);
        toast.error('Failed to fetch lent items');
      }
    };

    fetchLentItems();
  }, []);

  const handleUpdateItem = async (itemId) => {
    try {
      const itemRef = doc(db, 'lentshoes', itemId);
      await updateDoc(itemRef, {
        status: 'updated',
        processedAt: new Date().toISOString(),
      });
      toast.success('Item marked as updated!');
      setIsDetailVisible(false);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const ItemDetailSection = ({ label, icon: Icon, children, className = "" }) => (
    <div className={`flex items-start space-x-2 ${className}`}>
      {Icon && <Icon className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={16} />}
      <div className="flex-1">
        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}:
        </span>{" "}
        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {children}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <motion.div 
        className={`fixed bottom-6 right-6 z-50 ${
          isDarkMode ? 'bg-gray-700' : 'bg-white'
        } rounded-full shadow-lg p-3 cursor-pointer`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsDetailVisible(true)}
      >
        <div className="relative">
          <ShoppingBag 
            className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`} 
            size={24} 
          />
          {lentItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {lentItems.length}
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isDetailVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center"
            onClick={() => setIsDetailVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`w-full max-w-2xl mx-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg p-6 max-h-[80vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Pending Lent Items
                </h2>
                <button 
                  onClick={() => setIsDetailVisible(false)}
                  className={`${
                    isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  } p-2 rounded-full transition-colors`}
                >
                  <X size={24} />
                </button>
              </div>

              {lentItems.length === 0 ? (
                <p className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  No pending lent items
                </p>
              ) : (
                <div className="space-y-6">
                  {lentItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-lg font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {item.itemDetails.name} - {item.itemDetails.brand}
                          </h3>
                          <button
                            onClick={() => handleUpdateItem(item.id)}
                            className={`flex items-center space-x-2 px-3 py-1.5 ${
                              isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                            } text-white rounded-md text-sm transition-colors`}
                          >
                            <CheckCircle size={16} />
                            <span>Mark as Updated</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ItemDetailSection label="AT Number" icon={Tag}>
                            {item.itemDetails.atNo || 'N/A'}
                          </ItemDetailSection>

                          <ItemDetailSection label="Category" icon={Package}>
                            {item.itemDetails.category || 'N/A'}
                          </ItemDetailSection>

                          <ItemDetailSection label="Brand" icon={Tag}>
                            {item.itemDetails.brand}
                          </ItemDetailSection>

                          <ItemDetailSection label="Price" icon={Tag}>
                            Ksh {item.itemDetails.price?.toLocaleString()}
                          </ItemDetailSection>

                          <ItemDetailSection label="From Store" icon={Store}>
                            {item.fromStoreId}
                          </ItemDetailSection>

                          <ItemDetailSection label="To Store" icon={Store}>
                            {item.toStoreId}
                          </ItemDetailSection>

                          <ItemDetailSection label="Gender & Age Group" icon={Users}>
                            {item.itemDetails.gender} - {item.itemDetails.ageGroup}
                          </ItemDetailSection>

                          <ItemDetailSection label="Quantity & Type" icon={Package}>
                            {item.quantity} {item.type}
                          </ItemDetailSection>

                          <ItemDetailSection label="Sizes" icon={Tag}>
                            {item.itemDetails.sizes?.join(', ')}
                          </ItemDetailSection>

                          <ItemDetailSection label="Colors" icon={Tag}>
                            {item.itemDetails.colors?.join(', ')}
                          </ItemDetailSection>

                          <ItemDetailSection label="Lent Date" icon={Calendar}>
                            {new Date(item.lentDate).toLocaleString()}
                          </ItemDetailSection>

                          {item.processedAt && (
                            <ItemDetailSection label="Processed At" icon={Clock}>
                              {new Date(item.processedAt).toLocaleString()}
                            </ItemDetailSection>
                          )}
                        </div>

                        {item.notes && (
                          <ItemDetailSection label="Notes" className="col-span-full">
                            {item.notes}
                          </ItemDetailSection>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LentItemsTracker;