import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, offersResponse] = await Promise.all([
        axios.get('/api/orders/stats/summary'),
        axios.get('/api/offers')
      ]);
      
      setStats(statsResponse.data.summary);
      setOffers(offersResponse.data.offers);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedOffer || !targetUrl) {
      toast.error('Please select an offer and enter a target URL');
      return;
    }

    setPlacingOrder(true);
    try {
      await axios.post('/api/orders/bundle', {
        offerId: selectedOffer._id,
        targetUrl
      });

      toast.success('Order placed successfully!');
      setSelectedOffer(null);
      setTargetUrl('');
      fetchData(); // Refresh stats
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to place order';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${user?.wallet?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Likes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalLikes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Comments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalComments || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Order Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Order</h2>
          <p className="text-sm text-gray-600">Select a package and place your order</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOffer?._id === offer._id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => setSelectedOffer(offer)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                <span className="text-lg font-bold text-primary-600">
                  ${offer.price}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
              <div className="space-y-1 text-sm">
                {offer.likes > 0 && (
                  <div className="flex items-center">
                    <HeartIcon className="h-4 w-4 text-red-500 mr-2" />
                    <span>{offer.likes} Likes</span>
                  </div>
                )}
                {offer.comments > 0 && (
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{offer.comments} Comments</span>
                  </div>
                )}
                {offer.follows > 0 && (
                  <div className="flex items-center">
                    <UserPlusIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span>{offer.follows} Follows</span>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {offer.deliveryTime}
              </div>
            </div>
          ))}
        </div>

        {selectedOffer && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://facebook.com/your-post-url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cost: ${selectedOffer.price}</p>
                  <p className="text-xs text-gray-500">
                    Your balance: ${user?.wallet?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !targetUrl || user?.wallet < selectedOffer.price}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          <div className="text-center text-gray-500 py-8">
            <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No recent orders</p>
            <p className="text-sm">Your order history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 