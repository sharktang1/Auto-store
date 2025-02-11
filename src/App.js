import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './libs/firebase-config';

// Component imports
import Auth from './auth/Auth';
import AdminDashboard from './admin/Admin-Dashboard';
import StaffDashboard from './staff/Staff-Dashboard';
import SetupPopup from './components/SetupPopup';
import StaffSetupPopup from './components/StaffSetupPopup';
import LentItemsTracker from './components/LentItemsTracker';
import Navbar from './components/Navbar';

// Admin route imports
import AdminInventory from './admin/inventory/AdminInventory';
import AdminSales from './admin/sales/AdminSales';
import AdminStats from './admin/stats/AdminStats';
import AdminStaff from './admin/staff/AdminStaff';

// Staff route imports
import StaffInventory from './staff/inventory/StaffInventory';
import StaffSales from './staff/sales/StaffSales';
import StaffStats from './staff/stats/StaffStats';
import Stafflender from './staff/KOPA/stafflender';
import Staffreturns from './staff/Returns/staffreturns';

// Utils
import { getInitialTheme } from './utils/theme';

// AdminLayout Component with copied item functionality
const AdminLayout = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    isAdmin: true
  });
  const [copiedItemData, setCopiedItemData] = useState(null);
  const location = useLocation();

  // Check if current route is a sales page
  const isSalesPage = location.pathname.includes('/sales');

  const handleCopyItem = (itemData) => {
    setCopiedItemData(itemData);
    toast.success('Item copied successfully!');
  };

  useEffect(() => {
    const darkModeListener = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeListener.addEventListener('change', handleChange);

    // Fetch user data
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserData({
        username: user.displayName || 'Admin User',
        email: user.email,
        isAdmin: true
      });
    }

    return () => darkModeListener.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar
        username={userData.username}
        email={userData.email}
        isAdmin={userData.isAdmin}
      />
      {React.cloneElement(children, { copiedItemData })}
      {!isSalesPage && <LentItemsTracker isDarkMode={isDarkMode} onCopyItem={handleCopyItem} />}
    </div>
  );
};

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

// Main App Component
function App() {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);

            // Check for admin setup
            if (userData.role === 'admin') {
              const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
              if (!businessDoc.exists()) {
                setShowAdminSetup(true);
              }
            }
            
            // Check for staff setup
            if (userData.role === 'staff' && !userData.location) {
              setShowStaffSetup(true);
            }
          } else {
            // New user - initialize as admin
            await setDoc(doc(db, 'users', user.uid), {
              role: 'admin',
              email: user.email,
              createdAt: new Date().toISOString()
            });
            setUserRole('admin');
            setShowAdminSetup(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Error loading user data');
        }
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdminSetupSubmit = async (formData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'businesses', user.uid), {
        ...formData,
        createdAt: new Date().toISOString()
      });

      setShowAdminSetup(false);
      toast.success('Setup completed successfully!');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Setup failed. Please try again.');
    }
  };

  const handleStaffSetupSubmit = async (formData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'users', user.uid), {
        location: formData.location,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setShowStaffSetup(false);
      toast.success('Staff setup completed successfully!');
    } catch (error) {
      console.error('Staff setup error:', error);
      toast.error('Staff setup failed');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? 'dark' : 'light'}
          limit={3}
        />
        
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Auth />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route 
                      path="dashboard" 
                      element={
                        <>
                          <AdminDashboard />
                          <SetupPopup
                            isOpen={showAdminSetup}
                            onClose={() => setShowAdminSetup(false)}
                            onSubmit={handleAdminSetupSubmit}
                          />
                        </>
                      }
                    />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="sales" element={<AdminSales />} />
                    <Route path="stats" element={<AdminStats />} />
                    <Route path="staff" element={<AdminStaff />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route
                    path="dashboard"
                    element={
                      <>
                        <StaffDashboard />
                        <StaffSetupPopup
                          isOpen={showStaffSetup}
                          onClose={() => setShowStaffSetup(false)}
                          onSubmit={handleStaffSetupSubmit}
                        />
                      </>
                    }
                  />
                  <Route path="inventory" element={<StaffInventory />} />
                  <Route path="sales" element={<StaffSales />} />
                  <Route path="stats" element={<StaffStats />} />
                  <Route path="KOPA" element={<Stafflender />} />
                  <Route path="Returns" element={<Staffreturns />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );  
}

export default App;