// StaffLender.jsx
import React, { useState } from 'react';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import StaffNavbar from '../../components/StaffNavbar';
import LendItems from './LendItems';
import ViewLentItems from './ViewLentItems';

const StaffLender = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [view, setView] = useState('lend');

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <StaffNavbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Store Lending System
          </h1>

          <div className="flex gap-4">
            <button
              onClick={() => setView('lend')}
              className={`px-4 py-2 rounded-lg ${
                view === 'lend'
                  ? 'bg-blue-500 text-white'
                  : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Lend Items
            </button>
            <button
              onClick={() => setView('return')}
              className={`px-4 py-2 rounded-lg ${
                view === 'return'
                  ? 'bg-blue-500 text-white'
                  : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              Return Items
            </button>
          </div>
        </div>

        {view === 'lend' ? (
          <LendItems isDarkMode={isDarkMode} />
        ) : (
          <ViewLentItems isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
};

export default StaffLender;