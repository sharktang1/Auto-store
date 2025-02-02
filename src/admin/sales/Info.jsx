import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { X } from 'lucide-react';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';

const Info = ({ productId, onClose }) => {
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  // Initialize theme listener
  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    return () => cleanup?.();
  }, []);

  // Fetch product info
  useEffect(() => {
    const fetchProductInfo = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'inventory', productId));
        if (productDoc.exists()) {
          setProductInfo(productDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product info:', error);
        setLoading(false);
      }
    };

    fetchProductInfo();
  }, [productId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          Loading...
        </div>
      </div>
    );
  }

  if (!productInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`p-6 rounded-lg w-full max-w-2xl relative ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${
            isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">{productInfo.name}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Brand:</p>
            <p>{productInfo.brand}</p>
          </div>
          
          <div>
            <p className="font-semibold">Category:</p>
            <p>{productInfo.category}</p>
          </div>
          
          <div>
            <p className="font-semibold">Gender:</p>
            <p>{productInfo.gender}</p>
          </div>
          
          <div>
            <p className="font-semibold">Age Group:</p>
            <p>{productInfo.ageGroup}</p>
          </div>
          
          <div>
            <p className="font-semibold">Price:</p>
            <p>${productInfo.price}</p>
          </div>
          
          <div>
            <p className="font-semibold">Current Stock:</p>
            <p>{productInfo.stock}</p>
          </div>
          
          <div>
            <p className="font-semibold">Colors:</p>
            <p>{productInfo.colors?.join(', ') || 'N/A'}</p>
          </div>
          
          <div>
            <p className="font-semibold">Sizes:</p>
            <p>{productInfo.sizes?.join(', ') || 'N/A'}</p>
          </div>
          
          <div>
            <p className="font-semibold">AT Number:</p>
            <p>{productInfo.atNo}</p>
          </div>
          
          <div className="col-span-2">
            <p className="font-semibold">Notes:</p>
            <p>{productInfo.notes || 'No notes available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;