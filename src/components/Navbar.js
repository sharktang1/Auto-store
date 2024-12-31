import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ isDarkMode, toggleTheme, username = "John Doe", email = "john@example.com" }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const firstLetter = username.charAt(0).toUpperCase();

  return (
    <div className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          AutoStore
        </Link>
        
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? 
              <Sun className="text-orange-400" size={20} /> : 
              <Moon className="text-gray-900" size={20} />
            }
          </motion.button>

          <div className="relative">
            <motion.div
              className="flex items-center cursor-pointer"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-orange-500' : 'bg-orange-500'} 
                  flex items-center justify-center text-white font-semibold`}
              >
                {firstLetter}
              </motion.div>
              <ChevronDown 
                className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-transform duration-300 
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
                    ${isDarkMode ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}
                >
                  <div className="py-1">
                    <div className={`px-4 py-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <p className="font-medium">{username}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{email}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;