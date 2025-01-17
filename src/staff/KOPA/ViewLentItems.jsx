// ViewLentItems.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import { toast } from 'react-toastify';

const ViewLentItems = ({ isDarkMode }) => {
  const [lentItems, setLentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    let unsubscribeLentItems = null;

    const setupData = async () => {
      try {
        const auth = getAuth();
        if (!auth.currentUser) {
          toast.error('Please sign in');
          setLoading(false);
          return;
        }

        // Fetch user data to get store location
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();

        // Fetch businesses to get store ID
        const businessesRef = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesRef);
        let currentStoreId = null;

        businessesSnapshot.docs.forEach(doc => {
          const locations = doc.data().locations || [];
          locations.forEach((location, index) => {
            if (location === userData.location) {
              currentStoreId = `${doc.id}-store-${index + 1}`;
            }
          });
        });

        setStoreId(currentStoreId);

        // Setup lent items listener
        if (currentStoreId) {
          const lentShoesRef = collection(db, 'lentshoes');
          const lentQuery = query(lentShoesRef, 
            where('fromStoreId', '==', currentStoreId));

          unsubscribeLentItems = onSnapshot(lentQuery, (snapshot) => {
            const lentData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setLentItems(lentData);
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
      if (unsubscribeLentItems) unsubscribeLentItems();
    };
  }, []);

  const handleReturnItem = async (lentItem) => {
    try {
      // Update lent shoe status
      const lentItemRef = doc(db, 'lentshoes', lentItem.id);
      await updateDoc(lentItemRef, {
        status: 'returned',
        returnDate: new Date()
      });

      // Update inventory in both stores
      const sourceItemRef = doc(db, 'inventory', lentItem.itemId);
      const sourceDoc = await getDoc(sourceItemRef);
      
      if (sourceDoc.exists()) {
        await updateDoc(sourceItemRef, {
          stock: sourceDoc.data().stock + (lentItem.lendType === 'pair' ? 1 : 0.5),
          incompletePairs: lentItem.lendType === 'single' ? 
            Math.max(0, (sourceDoc.data().incompletePairs || 0) - 1) : 
            (sourceDoc.data().incompletePairs || 0)
        });
      }

      const destInventoryRef = collection(db, 'inventory');
      const destQuery = query(destInventoryRef,
        where('atNo', '==', lentItem.atNo),
        where('storeId', '==', lentItem.toStoreId));
      
      const destSnapshot = await getDocs(destQuery);
      
      if (!destSnapshot.empty) {
        const destDoc = destSnapshot.docs[0];
        await updateDoc(doc(db, 'inventory', destDoc.id), {
          stock: Math.max(0, destDoc.data().stock - (lentItem.lendType === 'pair' ? 1 : 0.5)),
          incompletePairs: lentItem.lendType === 'single' ? 
            Math.max(0, (destDoc.data().incompletePairs || 0) - 1) : 
            (destDoc.data().incompletePairs || 0)
        });
      }

      toast.success('Item successfully returned');
    } catch (error) {
      console.error('Error returning item:', error);
      toast.error('Error returning item');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
      <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Currently Lent Items
      </h2>
      
      {lentItems.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No items currently lent out
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                <th className="p-3 text-left">@No</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Lent To</th>
                <th className="p-3 text-left">Staff Member</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center">Lent Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {lentItems
                .filter(item => item.status === 'lent')
                .map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t ${
                      isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <td className="p-3">{item.atNo}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.toStoreName}</td>
                    <td className="p-3">{item.toStaffName}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        item.lendType === 'pair'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.lendType === 'pair' ? 'Pair' : 'Single'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.lentDate?.toDate().toLocaleDateString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        item.status === 'lent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReturnItem(item)}
                        className="p-2 text-blue-500 hover:text-blue-600"
                        title="Return Item"
                      >
                        <RotateCcw size={18} />
                      </motion.button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewLentItems;