import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Sun, Moon, UserCircle } from 'lucide-react';

const Auth = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AutoStore
          </h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            {isDarkMode ? 
              <Sun className="text-orange-400" /> : 
              <Moon className="text-gray-900" />
            }
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <div className={`rounded-lg shadow-lg p-8 transition-colors duration-300 
            ${isDarkMode ? 'bg-gray-800 shadow-gray-700' : 'bg-white shadow-gray-200'}`}>
            
            {/* Role Toggle */}
            <div className="flex justify-center space-x-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAdmin(true)}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                  isAdmin
                    ? 'bg-orange-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Admin
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAdmin(false)}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                  !isAdmin
                    ? 'bg-orange-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Staff
              </motion.button>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <UserCircle size={48} className="text-orange-500" />
            </div>

            {/* Title */}
            <h2 className={`text-2xl font-semibold text-center mb-6 
              ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isLogin ? 'Login' : 'Sign Up'} as {isAdmin ? 'Admin' : 'Staff'}
            </h2>

            {/* Form */}
            <form className="space-y-4">
              <div className="space-y-2">
                {/* Username Input */}
                <div className="relative">
                  <User className={`absolute left-3 top-3 
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="text"
                    placeholder="Username"
                    className={`w-full pl-10 pr-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent
                      ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} 
                      border transition-colors duration-300`}
                  />
                </div>

                {/* Email Input (Sign Up only) */}
                {!isLogin && (
                  <div className="relative">
                    <Mail className={`absolute left-3 top-3 
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                    <input
                      type="email"
                      placeholder="Email"
                      className={`w-full pl-10 pr-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent
                        ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} 
                        border transition-colors duration-300`}
                    />
                  </div>
                )}

                {/* Password Input */}
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    className={`w-full pl-10 pr-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent
                      ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} 
                      border transition-colors duration-300`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors duration-300"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </motion.button>

              {/* Toggle Login/Signup */}
              <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(!isLogin);
                  }}
                  className="text-orange-500 hover:text-orange-600 hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;