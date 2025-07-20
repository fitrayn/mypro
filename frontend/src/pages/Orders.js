import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatus = useCallback(async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/status`);
      return response.data.order;
    } catch (error) {
      console.error('Fetch order status error:', error);
      return null;
    }
  }, []);

  const updateOrderInList = useCallback((orderId, updatedData) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId ? { ...order, ...updatedData } : order
      )
    );
  }, []);

  const updateRunningOrders = useCallback(async () => {
    try {
      const runningOrders = orders.filter(order => order.status === 'running');
      
      for (const order of runningOrders) {
        const statusData = await fetchOrderStatus(order._id);
        if (statusData) {
          updateOrderInList(order._id, statusData);
        }
      }
    } catch (error) {
      console.error('Update running orders error:', error);
    }
  }, [orders, fetchOrderStatus, updateOrderInList]);

  const handleOrderClick = useCallback(async (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
    
    // إذا كان الطلب قيد التنفيذ، نحدث الحالة
    if (order.status === 'running') {
      const statusData = await fetchOrderStatus(order._id);
      if (statusData) {
        updateOrderInList(order._id, statusData);
        setSelectedOrder({ ...order, ...statusData });
      }
    }
  }, [fetchOrderStatus, updateOrderInList]);

  useEffect(() => {
    fetchOrders();
    
    // تحديث تلقائي كل 5 ثواني للطلبات قيد التنفيذ
    const interval = setInterval(() => {
      updateRunningOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [updateRunningOrders]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'done':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'running': return 'قيد التنفيذ';
      case 'done': return 'مكتمل';
      case 'failed': return 'فشل';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'running': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const calculateProgress = (order) => {
    if (order.status === 'pending') return 0;
    if (order.status === 'running') return 50;
    if (order.status === 'done') return 100;
    if (order.status === 'failed' || order.status === 'cancelled') return 0;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">لا توجد طلبات حتى الآن</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              onClick={() => handleOrderClick(order)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    طلب {order.type === 'bundle' ? 'حزمة' : 'مخصص'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(order.status)}
                  <span className="mr-2 text-sm">{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="mb-3">
                <a 
                  href={order.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-900 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.targetUrl.substring(0, 50)}...
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">إعجابات:</span>
                  <span className="font-semibold mr-1">{order.likes}</span>
                </div>
                <div>
                  <span className="text-gray-500">تعليقات:</span>
                  <span className="font-semibold mr-1">{order.comments}</span>
                </div>
                <div>
                  <span className="text-gray-500">متابعات:</span>
                  <span className="font-semibold mr-1">{order.follows}</span>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(order.status)}`}
                  style={{ width: `${calculateProgress(order)}%` }}
                ></div>
              </div>

              {order.successCount !== undefined && order.successCount > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  تم تنفيذ {order.successCount} إجراء بنجاح
                </div>
              )}

              {order.error && (
                <div className="mt-2 text-sm text-red-600">
                  خطأ: {order.error}
                </div>
              )}

              {/* مؤشر التحديث للطلبات قيد التنفيذ */}
              {order.status === 'running' && (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-xs text-blue-600">جاري التحديث...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal تفاصيل الطلب */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">تفاصيل الطلب</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">معلومات الطلب</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-gray-500">النوع:</span>
                    <span className="mr-2">{selectedOrder.type === 'bundle' ? 'حزمة' : 'مخصص'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الحالة:</span>
                    <span className="mr-2">{getStatusText(selectedOrder.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">التكلفة:</span>
                    <span className="mr-2">{selectedOrder.totalCost} جنيه</span>
                  </div>
                  <div>
                    <span className="text-gray-500">التاريخ:</span>
                    <span className="mr-2">{new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">الرابط المستهدف</h3>
                <a 
                  href={selectedOrder.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-900 break-all"
                >
                  {selectedOrder.targetUrl}
                </a>
              </div>

              <div>
                <h3 className="font-semibold">التفاعلات المطلوبة</h3>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{selectedOrder.likes}</div>
                    <div className="text-sm text-gray-500">إعجاب</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{selectedOrder.comments}</div>
                    <div className="text-sm text-gray-500">تعليق</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{selectedOrder.follows}</div>
                    <div className="text-sm text-gray-500">متابعة</div>
                  </div>
                </div>
              </div>

              {selectedOrder.results && selectedOrder.results.length > 0 && (
                <div>
                  <h3 className="font-semibold">نتائج التنفيذ</h3>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.results.map((result, index) => (
                      <div key={index} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm">
                          {result.type === 'like' ? 'إعجاب' : 
                           result.type === 'comment' ? 'تعليق' : 'متابعة'}: 
                          {result.success ? ' نجح' : ' فشل'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.error && (
                <div>
                  <h3 className="font-semibold text-red-600">خطأ</h3>
                  <p className="text-sm text-red-600 mt-1">{selectedOrder.error}</p>
                </div>
              )}

              {selectedOrder.startedAt && (
                <div>
                  <h3 className="font-semibold">أوقات التنفيذ</h3>
                  <div className="mt-2 text-sm">
                    <div>بدء التنفيذ: {new Date(selectedOrder.startedAt).toLocaleString('ar-SA')}</div>
                    {selectedOrder.completedAt && (
                      <div>انتهاء التنفيذ: {new Date(selectedOrder.completedAt).toLocaleString('ar-SA')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* مؤشر التحديث للطلبات قيد التنفيذ */}
              {selectedOrder.status === 'running' && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-600">جاري تنفيذ الطلب...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 