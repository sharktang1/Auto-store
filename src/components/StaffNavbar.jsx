// StaffNavbar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../libs/firebase-config.mjs';
import { signOut } from 'firebase/auth';
import { getInitialTheme, setTheme, initializeThemeListener } from '../utils/theme';
import { toast } from 'react-toastify';

const StaffNavbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: ''
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    initializeThemeListener(setIsDarkMode);
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserData({
        username: user.displayName || 'User',
        email: user.email
      });
    });
    return () => unsubscribe();
  }, [navigate]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/auth');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
    }
  };

  return (
    <nav className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          to="/staff/dashboard"
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          AutoStore Staff
        </Link>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-100 text-gray-800'
            }`}
          >
            {isDarkMode ? 
              <Sun className="text-orange-400" size={20} /> : 
              <Moon className="text-gray-900" size={20} />
            }
          </motion.button>

          <div className="relative">
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold"
              >
                {userData.username.charAt(0).toUpperCase()}
              </motion.div>
              <ChevronDown
                className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-transform duration-300
                  ${isProfileOpen ? 'rotate-180' : 'rotate-0'}`}
                size={20}
              />
            </motion.div>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg
                    ${isDarkMode ? 'bg-gray-700' : 'bg-white'} 
                    ring-1 ring-black ring-opacity-5 z-50`}
                >
                  <div className="py-1">
                    <div className={`px-4 py-2 border-b ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <p className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {userData.username}
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {userData.email}
                      </p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Staff
                      </p>
                    </div>

                    <Link
                      to="/staff/profile"
                      className={`block px-4 py-2 text-sm ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Your Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2
                        ${isDarkMode 
                          ? 'text-red-400 hover:bg-gray-600' 
                          : 'text-red-600 hover:bg-gray-100'
                        }`}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavbar;