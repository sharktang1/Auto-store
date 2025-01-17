import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, BarChart2, Clock, TrendingUp, TrendingDown } from 'lucide-react';

const InventoryStats = ({ isDarkMode }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#F97316', '#3B82F6', '#A855F7', '#10B981', '#EF4444', '#F59E0B'];

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const q = query(collection(db, 'inventory'));
        const querySnapshot = await getDocs(q);
        const inventory = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          daysInStock: getDaysInStock(doc.data().createdAt)
        }));
        
        setInventoryData(inventory);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getDaysInStock = (createdAt) => {
    const createDate = new Date(createdAt);
    const today = new Date();
    return Math.floor((today - createDate) / (1000 * 60 * 60 * 24));
  };

  // Process data for different visualizations
  const processCategoryData = () => {
    const categories = inventoryData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.stock;
      return acc;
    }, {});

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const processGenderData = () => {
    const genderCounts = inventoryData.reduce((acc, item) => {
      acc[item.gender] = (acc[item.gender] || 0) + item.stock;
      return acc;
    }, {});

    return Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const processAgeGroupData = () => {
    const ageGroups = inventoryData.reduce((acc, item) => {
      acc[item.ageGroup] = (acc[item.ageGroup] || 0) + item.stock;
      return acc;
    }, {});

    return Object.entries(ageGroups).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getSlowMovingItems = () => {
    return inventoryData
      .filter(item => item.stock > 0)
      .sort((a, b) => b.daysInStock - a.daysInStock)
      .slice(0, 5);
  };

  const processColorData = () => {
    const colorCounts = inventoryData.reduce((acc, item) => {
      item.colors.forEach(color => {
        acc[color] = (acc[color] || 0) + item.stock;
      });
      return acc;
    }, {});

    return Object.entries(colorCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-blue-500 text-white">
          <div className="flex items-center justify-between">
            <span>Total Items</span>
            <BarChart2 size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {inventoryData.reduce((sum, item) => sum + item.stock, 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-500 text-white">
          <div className="flex items-center justify-between">
            <span>Categories</span>
            <Calendar size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {new Set(inventoryData.map(item => item.category)).size}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-purple-500 text-white">
          <div className="flex items-center justify-between">
            <span>Avg Price</span>
            <TrendingUp size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            ${Math.round(inventoryData.reduce((sum, item) => sum + item.price, 0) / inventoryData.length)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-red-500 text-white">
          <div className="flex items-center justify-between">
            <span>Low Stock</span>
            <TrendingDown size={24} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {inventoryData.filter(item => item.stock < 5).length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-blue-500">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={processCategoryData()}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {processCategoryData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-green-500">
          <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
          <ResponsiveContainer>
            <BarChart data={processGenderData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Group Distribution */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-purple-500">
          <h3 className="text-lg font-semibold mb-4">Age Group Distribution</h3>
          <ResponsiveContainer>
            <BarChart data={processAgeGroupData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#A855F7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color Distribution */}
        <div className="h-80 p-4 rounded-lg bg-opacity-5 bg-red-500">
          <h3 className="text-lg font-semibold mb-4">Color Distribution</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={processColorData()}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {processColorData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Slow Moving Items */}
      <div className="p-4 rounded-lg bg-opacity-5 bg-yellow-500">
        <h3 className="text-lg font-semibold mb-4">Slow Moving Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2">Days in Stock</th>
                <th className="p-2">Current Stock</th>
                <th className="p-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {getSlowMovingItems().map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2">{item.daysInStock}</td>
                  <td className="p-2">{item.stock}</td>
                  <td className="p-2">${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats;