import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './auth/Auth';
import AdminDashboard from './admin/Admin-Dashboard';
import StaffDashboard from './staff/Staff-Dashboard';
import SetupPopup from './components/SetupPopup';
import StaffSetupPopup from './components/StaffSetupPopup';

// Admin imports
import AdminInventory from './admin/inventory/AdminInventory';
import AdminSales from './admin/sales/AdminSales';
import AdminStats from './admin/stats/AdminStats';
import AdminStaff from './admin/staff/AdminStaff';

// Staff imports
import StaffInventory from './staff/inventory/StaffInventory';
import StaffSales from './staff/sales/StaffSales';
import StaffStats from './staff/stats/StaffStats';

import { getInitialTheme } from './utils/theme';

function App() {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  const checkSetupStatus = (type) => {
    const key = type === 'admin' ? 'adminSetupCompleted' : 'staffSetupCompleted';
    return !localStorage.getItem(key);
  };

  const handleAdminSetupSubmit = (formData) => {
    localStorage.setItem('adminSetupCompleted', 'true');
    localStorage.setItem('businessSetup', JSON.stringify(formData));
    toast.success('Admin setup completed successfully!', {
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  const handleStaffSetupSubmit = (formData) => {
    localStorage.setItem('staffSetupCompleted', 'true');
    localStorage.setItem('staffSetup', JSON.stringify(formData));
    toast.success('Staff setup completed successfully!', {
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <ToastContainer 
          position="top-right" 
          autoClose={5000} 
          theme={isDarkMode ? 'dark' : 'light'} 
        />
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Auth />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <>
                <AdminDashboard onSetupClick={() => setShowAdminSetup(true)} />
                <SetupPopup
                  isOpen={showAdminSetup || checkSetupStatus('admin')}
                  onClose={() => setShowAdminSetup(false)}
                  onSubmit={handleAdminSetupSubmit}
                />
              </>
            }
          />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/stats" element={<AdminStats />} />
          <Route path="/admin/staff" element={<AdminStaff />} />

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <>
                <StaffDashboard onSetupClick={() => setShowStaffSetup(true)} />
                <StaffSetupPopup
                  isOpen={showStaffSetup || checkSetupStatus('staff')}
                  onClose={() => setShowStaffSetup(false)}
                  onSubmit={handleStaffSetupSubmit}
                />
              </>
            }
          />
          <Route path="/staff/inventory" element={<StaffInventory />} />
          <Route path="/staff/sales" element={<StaffSales />} />
          <Route path="/staff/stats" element={<StaffStats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;