import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [customOrder, setCustomOrder] = useState({
    targetUrl: '',
    likes: 0,
    comments: 0,
    follows: 0
  });
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomOrder = async (e) => {
    e.preventDefault();
    
    const totalEngagement = customOrder.likes + customOrder.comments + customOrder.follows;
    if (totalEngagement === 0) {
      toast.error('Please specify at least one engagement type');
      return;
    }

    setPlacingOrder(true);
    try {
      await axios.post('/api/orders/custom', customOrder);
      toast.success('Custom order placed successfully!');
      setCustomOrder({ targetUrl: '', likes: 0, comments: 0, follows: 0 });
      setShowCustomOrder(false);
      fetchOrders();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to place custom order';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-badge status-pending',
      running: 'status-badge status-running',
      done: 'status-badge status-done',
      failed: 'status-badge status-failed'
    };

    return (
      <span className={statusClasses[status] || 'status-badge status-pending'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your engagement orders</p>
        </div>
        <button
          onClick={() => setShowCustomOrder(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Custom Order
        </button>
      </div>

      {/* Custom Order Modal */}
      {showCustomOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Custom Order</h3>
              <form onSubmit={handleCustomOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target URL
                  </label>
                  <input
                    type="url"
                    required
                    className="input-field"
                    placeholder="https://facebook.com/your-post-url"
                    value={customOrder.targetUrl}
                    onChange={(e) => setCustomOrder({...customOrder, targetUrl: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Likes
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={customOrder.likes}
                      onChange={(e) => setCustomOrder({...customOrder, likes: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={customOrder.comments}
                      onChange={(e) => setCustomOrder({...customOrder, comments: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follows
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={customOrder.follows}
                      onChange={(e) => setCustomOrder({...customOrder, follows: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomOrder(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="btn-primary disabled:opacity-50"
                  >
                    {placingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <EyeIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No orders yet</p>
            <p className="text-sm">Your orders will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order._id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {order.targetUrl}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {order.likes > 0 && (
                          <div className="flex items-center text-sm">
                            <HeartIcon className="h-4 w-4 text-red-500 mr-1" />
                            {order.likes}
                          </div>
                        )}
                        {order.comments > 0 && (
                          <div className="flex items-center text-sm">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 mr-1" />
                            {order.comments}
                          </div>
                        )}
                        {order.follows > 0 && (
                          <div className="flex items-center text-sm">
                            <UserPlusIcon className="h-4 w-4 text-green-500 mr-1" />
                            {order.follows}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.totalCost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders; 