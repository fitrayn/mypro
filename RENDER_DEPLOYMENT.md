# دليل نشر المشروع على Render

## 📋 المتطلبات المسبقة

1. حساب على [Render.com](https://render.com)
2. مشروع MongoDB Atlas (للبيانات)
3. GitHub repository للمشروع

## 🚀 خطوات النشر

### 1. إعداد قاعدة البيانات

1. اذهب إلى [MongoDB Atlas](https://cloud.mongodb.com)
2. أنشئ مشروع جديد
3. أنشئ cluster جديد (يمكنك استخدام الخطة المجانية)
4. أنشئ مستخدم لقاعدة البيانات
5. احصل على connection string

### 2. رفع المشروع على Render

#### الطريقة الأولى: النشر التلقائي من GitHub

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على "New +" ثم اختر "Web Service"
3. اربط حساب GitHub الخاص بك
4. اختر repository المشروع
5. املأ المعلومات التالية:
   - **Name**: `facebook-automation-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd frontend && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

#### الطريقة الثانية: استخدام render.yaml

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على "New +" ثم اختر "Blueprint"
3. اربط حساب GitHub
4. اختر repository المشروع
5. Render سيقوم تلقائياً بإنشاء الخدمات المطلوبة

### 3. إعداد متغيرات البيئة

في Render Dashboard، اذهب إلى خدمة Backend وأضف المتغيرات التالية:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook-automation
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://facebook-automation-frontend.onrender.com
```

### 4. إعداد خدمة Frontend

1. في Render Dashboard، اضغط على "New +" ثم اختر "Static Site"
2. اربط نفس repository
3. املأ المعلومات:
   - **Name**: `facebook-automation-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

### 5. إعداد متغيرات البيئة للفرونت إند

أضف المتغير التالي:
```
REACT_APP_API_URL=https://facebook-automation-backend.onrender.com
```

## 🔧 إعدادات إضافية

### إعداد CORS

تأكد من أن ملف `backend/server.js` يحتوي على إعدادات CORS الصحيحة:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### إعداد Health Check

المشروع يحتوي على endpoint للـ health check:
```
GET /api/health
```

## 🌐 روابط النشر

بعد النشر، ستكون الروابط كالتالي:
- **Backend API**: `https://facebook-automation-backend.onrender.com`
- **Frontend**: `https://facebook-automation-frontend.onrender.com`

## 🔍 اختبار النشر

1. تحقق من أن Backend يعمل: `https://facebook-automation-backend.onrender.com/api/health`
2. تحقق من أن Frontend يعمل: `https://facebook-automation-frontend.onrender.com`

## 📝 ملاحظات مهمة

1. **الخطة المجانية**: Render يوفر خطة مجانية محدودة، قد تحتاج لترقية للاستخدام التجاري
2. **الوقت**: الخدمات المجانية قد تستغرق وقتاً للبدء عند عدم الاستخدام
3. **البيانات**: تأكد من إعداد MongoDB Atlas بشكل صحيح
4. **الأمان**: غيّر JWT_SECRET في الإنتاج

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تحقق من MONGODB_URI
   - تأكد من إعدادات MongoDB Atlas

2. **خطأ في CORS**
   - تحقق من FRONTEND_URL
   - تأكد من إعدادات CORS في Backend

3. **خطأ في Build**
   - تحقق من package.json
   - تأكد من وجود جميع التبعيات

## 📞 الدعم

إذا واجهت أي مشاكل، يمكنك:
1. مراجعة logs في Render Dashboard
2. التحقق من إعدادات المتغيرات البيئية
3. التأكد من أن جميع الملفات موجودة في repository 