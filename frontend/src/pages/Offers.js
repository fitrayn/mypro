import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import {
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState({
    targetUrl: '',
    likes: 0,
    comments: 0,
    follows: 0
  });
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/api/offers');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Fetch offers error:', error);
      toast.error('فشل في تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferClick = (offer) => {
    setSelectedOffer(offer);
    setOrderData({
      targetUrl: '',
      likes: offer.likes,
      comments: offer.comments,
      follows: offer.follows
    });
    setShowOrderModal(true);
  };

  const handleCustomOrder = async (e) => {
    e.preventDefault();
    
    const totalEngagement = orderData.likes + orderData.comments + orderData.follows;
    if (totalEngagement === 0) {
      toast.error('يرجى تحديد نوع واحد على الأقل من التفاعلات');
      return;
    }

    if (!orderData.targetUrl) {
      toast.error('يرجى إدخال رابط الهدف');
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await api.post('/api/orders/custom', orderData);
      toast.success('تم تقديم الطلب بنجاح!');
      setShowOrderModal(false);
      setOrderData({ targetUrl: '', likes: 0, comments: 0, follows: 0 });
    } catch (error) {
      const message = error.response?.data?.error || 'فشل في تقديم الطلب';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleBundleOrder = async (e) => {
    e.preventDefault();
    
    if (!orderData.targetUrl) {
      toast.error('يرجى إدخال رابط الهدف');
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await api.post('/api/orders/bundle', {
        offerId: selectedOffer._id,
        targetUrl: orderData.targetUrl
      });
      toast.success('تم تقديم الطلب بنجاح!');
      setShowOrderModal(false);
      setOrderData({ targetUrl: '', likes: 0, comments: 0, follows: 0 });
    } catch (error) {
      const message = error.response?.data?.error || 'فشل في تقديم الطلب';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const calculateTotalCost = (likes, comments, follows) => {
    const costPerEngagement = 0.01; // 1 قرش لكل تفاعل
    return (likes + comments + follows) * costPerEngagement;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">العروض المتاحة</h1>
        <p className="text-gray-600">اختر العرض المناسب لك أو أنشئ طلب مخصص</p>
      </div>

      {/* العروض الجاهزة */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">العروض الجاهزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleOfferClick(offer)}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{offer.name}</h3>
                <p className="text-gray-600 text-sm">{offer.description}</p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-gray-700">عدد الإعجابات</span>
                  </div>
                  <span className="font-bold text-red-600">{offer.likes}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700">عدد التعليقات</span>
                  </div>
                  <span className="font-bold text-blue-600">{offer.comments}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserPlusIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">عدد المتابعات</span>
                  </div>
                  <span className="font-bold text-green-600">{offer.follows}</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {offer.price} جنيه
                </div>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  <ShoppingCartIcon className="h-5 w-5 inline mr-2" />
                  طلب هذا العرض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* الطلب المخصص */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">طلب مخصص</h2>
        <p className="text-gray-600 mb-4">أنشئ طلبك الخاص باختيار عدد التفاعلات التي تريدها</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <HeartIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-2">الإعجابات</h3>
            <p className="text-sm text-gray-600 mb-3">اكتب عدد الإعجابات المطلوبة</p>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded text-center"
              placeholder="0"
              value={orderData.likes}
              onChange={(e) => setOrderData({...orderData, likes: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-2">التعليقات</h3>
            <p className="text-sm text-gray-600 mb-3">اكتب عدد التعليقات المطلوبة</p>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded text-center"
              placeholder="0"
              value={orderData.comments}
              onChange={(e) => setOrderData({...orderData, comments: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <UserPlusIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-2">المتابعات</h3>
            <p className="text-sm text-gray-600 mb-3">اكتب عدد المتابعات المطلوبة</p>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded text-center"
              placeholder="0"
              value={orderData.follows}
              onChange={(e) => setOrderData({...orderData, follows: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رابط الهدف (رابط المنشور أو الصفحة)
          </label>
          <input
            type="url"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="https://facebook.com/your-post-url"
            value={orderData.targetUrl}
            onChange={(e) => setOrderData({...orderData, targetUrl: e.target.value})}
          />
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            التكلفة الإجمالية: {calculateTotalCost(orderData.likes, orderData.comments, orderData.follows)} جنيه
          </div>
          <button
            onClick={handleCustomOrder}
            disabled={placingOrder}
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {placingOrder ? 'جاري التقديم...' : 'تقديم الطلب المخصص'}
          </button>
        </div>
      </div>

      {/* Modal تأكيد الطلب */}
      {showOrderModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">تأكيد الطلب</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">{selectedOffer.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>الإعجابات:</span>
                  <span className="font-semibold">{selectedOffer.likes}</span>
                </div>
                <div className="flex justify-between">
                  <span>التعليقات:</span>
                  <span className="font-semibold">{selectedOffer.comments}</span>
                </div>
                <div className="flex justify-between">
                  <span>المتابعات:</span>
                  <span className="font-semibold">{selectedOffer.follows}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>التكلفة:</span>
                  <span className="text-green-600">{selectedOffer.price} جنيه</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الهدف
              </label>
              <input
                type="url"
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="https://facebook.com/your-post-url"
                value={orderData.targetUrl}
                onChange={(e) => setOrderData({...orderData, targetUrl: e.target.value})}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleBundleOrder}
                disabled={placingOrder || !orderData.targetUrl}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {placingOrder ? 'جاري التقديم...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers; 