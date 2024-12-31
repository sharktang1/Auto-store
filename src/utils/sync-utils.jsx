import { db } from '../libs/firebase-config';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getInitialTheme } from './theme';

export const syncLocalStorageToFirestore = async (userId) => {
  const isDarkMode = getInitialTheme();
  const collections = {
    business: {
      ref: doc(db, 'businesses', userId),
      localKey: 'businessSetup',
      transform: data => ({
        businessName: data.businessName || '',
        numberOfStores: parseInt(data.numberOfStores) || 1,
        locations: data.locations || [],
        lastSynced: new Date().toISOString()
      })
    },
    inventory: {
      ref: doc(db, 'inventory', userId),
      localKey: 'admin-inventory',
      transform: data => ({
        items: data,
        lastSynced: new Date().toISOString()
      })
    },
    staff: {
      ref: collection(db, 'users'),
      localKey: 'staff-data',
      isCollection: true
    }
  };

  try {
    for (const [key, config] of Object.entries(collections)) {
      const localData = JSON.parse(localStorage.getItem(config.localKey) || '[]');
      const localLastModified = localStorage.getItem(`${config.localKey}LastModified`);

      if (config.isCollection) {
        const snapshot = await getDocs(config.ref);
        const firestoreData = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.role === 'staff') {
            firestoreData.push({ id: doc.id, ...data });
          }
        });

        const firestoreLastModified = Math.max(...firestoreData.map(d => 
          d.lastModified ? new Date(d.lastModified).getTime() : 0
        ));

        if (!localLastModified || new Date(localLastModified).getTime() < firestoreLastModified) {
          localStorage.setItem(config.localKey, JSON.stringify(firestoreData));
          localStorage.setItem(`${config.localKey}LastModified`, new Date(firestoreLastModified).toISOString());
        }
      } else {
        const doc = await getDoc(config.ref);
        if (!doc.exists()) {
          await setDoc(config.ref, config.transform(localData));
        } else {
          const firestoreData = doc.data();
          
          if (!localLastModified || new Date(localLastModified) > new Date(firestoreData.lastSynced)) {
            await setDoc(config.ref, config.transform(localData));
          } else {
            localStorage.setItem(config.localKey, 
              JSON.stringify(config.localKey === 'admin-inventory' ? firestoreData.items : firestoreData));
          }
        }
      }
    }

    toast.success('Data synchronized successfully', {
      position: "top-right",
      autoClose: 3000,
      theme: isDarkMode ? 'dark' : 'light'
    });
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    toast.error('Failed to synchronize data', {
      position: "top-right",
      autoClose: 3000,
      theme: isDarkMode ? 'dark' : 'light'
    });
    return false;
  }
};

export const updateLocalStorageTimestamp = (key) => {
  localStorage.setItem(`${key}LastModified`, new Date().toISOString());
};

export const initializeSyncListeners = () => {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (['admin-inventory', 'businessSetup', 'staff-data'].includes(key)) {
      updateLocalStorageTimestamp(key);
    }
  };
};