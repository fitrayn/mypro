import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    likes: 0,
    comments: 0,
    follows: 0,
    price: 0,
    category: '',
    deliveryTime: '',
    isActive: true
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/api/offers');
      // Ensure we have valid data
      const offersData = Array.isArray(response.data?.offers) ? response.data.offers : [];
      setOffers(offersData);
    } catch (error) {
      console.error('Fetch offers error:', error);
      toast.error('فشل في تحميل العروض');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const addOffer = async () => {
    if (!newOffer.title || !newOffer.price) {
      toast.error('يرجى إدخال العنوان والسعر');
      return;
    }

    try {
      await api.post('/api/offers', newOffer);
      toast.success('تم إضافة العرض بنجاح');
      setNewOffer({
        title: '',
        description: '',
        likes: 0,
        comments: 0,
        follows: 0,
        price: 0,
        category: '',
        deliveryTime: '',
        isActive: true
      });
      fetchOffers();
    } catch (error) {
      console.error('Add offer error:', error);
      toast.error('فشل في إضافة العرض');
    }
  };

  const toggleOfferStatus = async (offerId, isActive) => {
    try {
      await api.patch(`/api/offers/${offerId}`, { isActive: !isActive });
      toast.success('تم تحديث حالة العرض بنجاح');
      fetchOffers();
    } catch (error) {
      console.error('Toggle offer status error:', error);
      toast.error('فشل في تحديث حالة العرض');
    }
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
      <h1 className="text-2xl font-bold mb-6">إدارة العروض</h1>
      
      {/* إضافة عرض جديد */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">إضافة عرض جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={newOffer.title}
            onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
            placeholder="عنوان العرض"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            value={newOffer.price}
            onChange={(e) => setNewOffer({...newOffer, price: parseFloat(e.target.value)})}
            placeholder="السعر"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <input
            type="number"
            value={newOffer.likes}
            onChange={(e) => setNewOffer({...newOffer, likes: parseInt(e.target.value)})}
            placeholder="عدد الإعجابات"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            value={newOffer.comments}
            onChange={(e) => setNewOffer({...newOffer, comments: parseInt(e.target.value)})}
            placeholder="عدد التعليقات"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            value={newOffer.follows}
            onChange={(e) => setNewOffer({...newOffer, follows: parseInt(e.target.value)})}
            placeholder="عدد المتابعات"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            value={newOffer.category}
            onChange={(e) => setNewOffer({...newOffer, category: e.target.value})}
            placeholder="الفئة"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            value={newOffer.deliveryTime}
            onChange={(e) => setNewOffer({...newOffer, deliveryTime: e.target.value})}
            placeholder="وقت التسليم (مثال: 24 ساعة)"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <textarea
          value={newOffer.description}
          onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
          placeholder="وصف العرض"
          className="w-full border border-gray-300 rounded px-3 py-2 mt-4 h-20"
        />
        <button
          onClick={addOffer}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          إضافة العرض
        </button>
      </div>

      {/* جدول العروض */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العنوان
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التفاعلات
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                السعر
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الفئة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(offers) && offers.length > 0 ? (
              offers.map((offer) => (
                <tr key={offer._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{offer.title}</div>
                      <div className="text-gray-500 text-xs">{offer.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>إعجابات: {offer.likes}</div>
                      <div>تعليقات: {offer.comments}</div>
                      <div>متابعات: {offer.follows}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${offer.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {offer.category || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {offer.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleOfferStatus(offer._id, offer.isActive)}
                      className={`${
                        offer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {offer.isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  لا توجد عروض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Offers; 