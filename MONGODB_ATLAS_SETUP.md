# إعداد MongoDB Atlas

## الخطوات:

### 1. إنشاء حساب MongoDB Atlas:
1. اذهب إلى: https://www.mongodb.com/atlas
2. انقر على "Try Free"
3. سجل حساب جديد أو سجل دخول

### 2. إنشاء Cluster:
1. انقر على "Build a Database"
2. اختر "FREE" tier (M0)
3. اختر Cloud Provider (AWS, Google Cloud, أو Azure)
4. اختر Region (يفضل الأقرب لك)
5. انقر على "Create"

### 3. إعداد Database Access:
1. اذهب إلى "Database Access" في القائمة الجانبية
2. انقر على "Add New Database User"
3. اختر "Password" كطريقة المصادقة
4. أدخل username و password
5. اختر "Read and write to any database"
6. انقر على "Add User"

### 4. إعداد Network Access:
1. اذهب إلى "Network Access" في القائمة الجانبية
2. انقر على "Add IP Address"
3. اختر "Allow Access from Anywhere" (0.0.0.0/0)
4. انقر على "Confirm"

### 5. الحصول على Connection String:
1. اذهب إلى "Database" في القائمة الجانبية
2. انقر على "Connect"
3. اختر "Connect your application"
4. انسخ Connection String

### 6. تحديث ملف .env:
استبدل MONGODB_URI في ملف .env بـ:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/facebook-automation?retryWrites=true&w=majority
```

### 7. تشغيل المشروع:
```bash
npm run dev
```

## ملاحظات مهمة:
- استبدل `username` و `password` بالمعلومات التي أنشأتها
- استبدل `cluster` باسم cluster الخاص بك
- تأكد من أن IP Address مسموح له بالوصول 