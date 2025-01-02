import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './libs/firebase-config';

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return children;
};

function App() {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [userRole, setUserRole] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            
            // Check if staff setup is needed
            if (userData.role === 'staff' && !userData.location) {
              setShowStaffSetup(true);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdminSetupSubmit = (formData) => {
    localStorage.setItem('adminSetupCompleted', 'true');
    localStorage.setItem('businessSetup', JSON.stringify(formData));
    setShowAdminSetup(false);
    toast.success('Admin setup completed successfully!', {
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  const handleStaffSetupSubmit = async (formData) => {
    try {
      localStorage.setItem('staffSetupCompleted', 'true');
      localStorage.setItem('staffSetup', JSON.stringify(formData));
      setShowStaffSetup(false);
      toast.success('Staff setup completed successfully!', {
        theme: isDarkMode ? 'dark' : 'light',
      });
    } catch (error) {
      console.error('Error in staff setup:', error);
      toast.error('Failed to complete staff setup', {
        theme: isDarkMode ? 'dark' : 'light',
      });
    }
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
              <ProtectedRoute>
                <>
                  <AdminDashboard onSetupClick={() => setShowAdminSetup(true)} />
                  <SetupPopup
                    isOpen={showAdminSetup}
                    onClose={() => setShowAdminSetup(false)}
                    onSubmit={handleAdminSetupSubmit}
                  />
                </>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <StaffDashboard onSetupClick={() => setShowStaffSetup(true)} />
                  <StaffSetupPopup
                    isOpen={showStaffSetup}
                    onClose={() => setShowStaffSetup(false)}
                    onSubmit={handleStaffSetupSubmit}
                  />
                </>
              </ProtectedRoute>
            }
          />
          <Route path="/staff/inventory" element={<ProtectedRoute><StaffInventory /></ProtectedRoute>} />
          <Route path="/staff/sales" element={<ProtectedRoute><StaffSales /></ProtectedRoute>} />
          <Route path="/staff/stats" element={<ProtectedRoute><StaffStats /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;