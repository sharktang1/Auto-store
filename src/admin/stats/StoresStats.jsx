import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Store, DollarSign, Users, Package } from 'lucide-react';

const StoresStats = ({ isDarkMode }) => {
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [businessData, setBusinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#F97316', '#3B82F6', '#A855F7', '#10B981', '#EF4444', '#F59E0B'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch business data first
        const businessQuery = query(collection(db, 'businesses'));
        const businessSnapshot = await getDocs(businessQuery);
        const business = businessSnapshot.docs[0]?.data(); // Assuming one business for now
        setBusinessData(business);

        if (business) {
          // Fetch sales data for all store locations
          const salesQuery = query(
            collection(db, 'sales'),
            where('storeLocation', 'in', business.locations)
          );
          const salesSnapshot = await getDocs(salesQuery);
          const sales = salesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            timestamp: doc.data().timestamp?.toDate() || new Date()
          }));
          setSalesData(sales);

          // Fetch inventory data for all stores
          const inventoryQuery = query(collection(db, 'inventory'));
          const inventorySnapshot = await getDocs(inventoryQuery);
          const inventory = inventorySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            daysInStock: getDaysInStock(doc.data().createdAt)
          }));
          setInventoryData(inventory);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load store statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysInStock = (createdAt) => {
    const createDate = new Date(createdAt);
    const today = new Date();
    return Math.floor((today - createDate) / (1000 * 60 * 60 * 24));
  };

  // Process store performance data
  const getStorePerformance = () => {
    if (!businessData?.locations) return [];

    return businessData.locations.map(location => {
      const storeSales = salesData.filter(sale => sale.storeLocation === location);
      const storeInventory = inventoryData.filter(item => item.storeId === `store-${location}`);

      return {
        name: location,
        totalSales: storeSales.reduce((sum, sale) => sum + sale.quantity, 0),
        totalRevenue: storeSales.reduce((sum, sale) => sum + sale.total, 0),
        customerCount: new Set(storeSales.map(sale => sale.customerPhone)).size,
        genderDistribution: storeSales.reduce((acc, sale) => {
          const product = inventoryData.find(item => item.id === sale.productId);
          if (product) {
            acc[product.gender] = (acc[product.gender] || 0) + sale.quantity;
          }
          return acc;
        }, { Men: 0, Women: 0, Kids: 0 }),
        inventory: {
          total: storeInventory.reduce((sum, item) => sum + item.stock, 0),
          slowMoving: storeInventory.filter(item => item.daysInStock > 30 && item.stock > 5).length,
          fastMoving: storeInventory.filter(item => item.stock < 3).length
        }
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  const storePerformance = getStorePerformance();

  return (
    <div className={`p-6 space-y-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-blue-500 text-white">
          <div className="flex items-center justify-between">
            <span>Total Stores</span>
            <Store size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {businessData?.locations?.length || 0}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-500 text-white">
          <div className="flex items-center justify-between">
            <span>Total Revenue</span>
            <DollarSign size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            ${salesData.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-purple-500 text-white">
          <div className="flex items-center justify-between">
            <span>Total Customers</span>
            <Users size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {new Set(salesData.map(sale => sale.customerPhone)).size}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-red-500 text-white">
          <div className="flex items-center justify-between">
            <span>Total Products</span>
            <Package size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {inventoryData.length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Sales Performance */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-blue-500">
          <h3 className="text-lg font-semibold mb-4">Store Sales Performance</h3>
          <ResponsiveContainer>
            <BarChart data={storePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSales" fill="#3B82F6" name="Total Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution by Store */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-green-500">
          <h3 className="text-lg font-semibold mb-4">Customer Gender Distribution</h3>
          <ResponsiveContainer>
            <BarChart data={storePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="genderDistribution.Men" stackId="gender" fill="#3B82F6" name="Men" />
              <Bar dataKey="genderDistribution.Women" stackId="gender" fill="#F97316" name="Women" />
              <Bar dataKey="genderDistribution.Kids" stackId="gender" fill="#10B981" name="Kids" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Status */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-purple-500">
          <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
          <ResponsiveContainer>
            <BarChart data={storePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="inventory.slowMoving" fill="#EF4444" name="Slow Moving" />
              <Bar dataKey="inventory.fastMoving" fill="#10B981" name="Fast Moving" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-red-500">
          <h3 className="text-lg font-semibold mb-4">Revenue Distribution</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={storePerformance}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="totalRevenue"
              >
                {storePerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Details Table */}
      <div className="p-4 rounded-lg bg-opacity-5 bg-yellow-500">
        <h3 className="text-lg font-semibold mb-4">Store Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Store Location</th>
                <th className="p-2">Total Sales</th>
                <th className="p-2">Revenue</th>
                <th className="p-2">Customers</th>
                <th className="p-2">Slow Moving Items</th>
                <th className="p-2">Fast Moving Items</th>
              </tr>
            </thead>
            <tbody>
              {storePerformance.map((store) => (
                <tr key={store.name} className="border-t">
                  <td className="p-2">{store.name}</td>
                  <td className="p-2">{store.totalSales}</td>
                  <td className="p-2">${store.totalRevenue.toLocaleString()}</td>
                  <td className="p-2">{store.customerCount}</td>
                  <td className="p-2">{store.inventory.slowMoving}</td>
                  <td className="p-2">{store.inventory.fastMoving}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoresStats;