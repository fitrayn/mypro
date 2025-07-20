const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Order = require('./backend/models/Order');
const Cookie = require('./backend/models/Cookie');
const Proxy = require('./backend/models/Proxy');
const Offer = require('./backend/models/Offer');

async function setupDatabase() {
  try {
    console.log('🔗 جاري الاتصال بقاعدة البيانات...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // Create collections and indexes
    console.log('📊 جاري إنشاء الجداول والفهارس...');
    
    // Create indexes for Users collection
    await User.createIndexes();
    console.log('✅ تم إنشاء جدول المستخدمين');
    
    // Create indexes for Orders collection
    await Order.createIndexes();
    console.log('✅ تم إنشاء جدول الطلبات');
    
    // Create indexes for Cookies collection
    await Cookie.createIndexes();
    console.log('✅ تم إنشاء جدول الكوكيز');
    
    // Create indexes for Proxies collection
    await Proxy.createIndexes();
    console.log('✅ تم إنشاء جدول البروكسيات');
    
    // Create indexes for Offers collection
    await Offer.createIndexes();
    console.log('✅ تم إنشاء جدول العروض');
    
    // Create admin user
    console.log('👤 جاري إنشاء حساب المشرف...');
    
    const adminExists = await User.findOne({ email: 'admin@facebook-automation.com' });
    
    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@facebook-automation.com',
        password: 'admin123456',
        wallet: 10000,
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('✅ تم إنشاء حساب المشرف:');
      console.log('   البريد الإلكتروني: admin@facebook-automation.com');
      console.log('   كلمة المرور: admin123456');
    } else {
      console.log('ℹ️ حساب المشرف موجود بالفعل');
    }
    
    // Create sample offers
    console.log('📦 جاري إنشاء عروض تجريبية...');
    
    const offers = [
      {
        title: 'حزمة البداية',
        description: 'حزمة مثالية للمبتدئين',
        likes: 100,
        comments: 50,
        follows: 25,
        price: 10,
        category: 'مبتدئ',
        deliveryTime: '24 ساعة',
        isActive: true
      },
      {
        title: 'حزمة متوسطة',
        description: 'حزمة متوازنة للاستخدام المتوسط',
        likes: 250,
        comments: 100,
        follows: 50,
        price: 25,
        category: 'متوسط',
        deliveryTime: '48 ساعة',
        isActive: true
      },
      {
        title: 'حزمة احترافية',
        description: 'حزمة شاملة للاستخدام الاحترافي',
        likes: 500,
        comments: 200,
        follows: 100,
        price: 50,
        category: 'احترافي',
        deliveryTime: '72 ساعة',
        isActive: true
      },
      {
        title: 'حزمة VIP',
        description: 'حزمة فاخرة للاستخدام المكثف',
        likes: 1000,
        comments: 500,
        follows: 250,
        price: 100,
        category: 'VIP',
        deliveryTime: '5 أيام',
        isActive: true
      }
    ];
    
    for (const offerData of offers) {
      const offerExists = await Offer.findOne({ title: offerData.title });
      if (!offerExists) {
        const offer = new Offer(offerData);
        await offer.save();
        console.log(`✅ تم إنشاء عرض: ${offerData.title}`);
      }
    }
    
    // Create sample cookies
    console.log('🍪 جاري إنشاء كوكيز تجريبية...');
    
    const sampleCookies = [
      'c_user=100012345678901; xs=12%3Aabcdef%3A2%3A1234567890%3A-1%3A1234567890;',
      'c_user=100012345678902; xs=12%3Aabcdef%3A2%3A1234567891%3A-1%3A1234567891;',
      'c_user=100012345678903; xs=12%3Aabcdef%3A2%3A1234567892%3A-1%3A1234567892;',
      'c_user=100012345678904; xs=12%3Aabcdef%3A2%3A1234567893%3A-1%3A1234567893;',
      'c_user=100012345678905; xs=12%3Aabcdef%3A2%3A1234567894%3A-1%3A1234567894;'
    ];
    
    for (const cookieData of sampleCookies) {
      const cookieExists = await Cookie.findOne({ cookie: cookieData });
      if (!cookieExists) {
        const cookie = new Cookie({
          cookie: cookieData,
          status: 'active',
          label: 'كوكي تجريبي',
          notes: 'كوكي تجريبي للاختبار'
        });
        await cookie.save();
        console.log('✅ تم إنشاء كوكي تجريبي');
      }
    }
    
    // Create sample proxies
    console.log('🌐 جاري إنشاء بروكسيات تجريبية...');
    
    const sampleProxies = [
      {
        ip: '192.168.1.100',
        port: '8080',
        username: 'proxy1',
        password: 'pass123',
        country: 'US',
        status: 'working'
      },
      {
        ip: '192.168.1.101',
        port: '8080',
        username: 'proxy2',
        password: 'pass456',
        country: 'UK',
        status: 'working'
      },
      {
        ip: '192.168.1.102',
        port: '8080',
        username: 'proxy3',
        password: 'pass789',
        country: 'DE',
        status: 'working'
      }
    ];
    
    for (const proxyData of sampleProxies) {
      const proxyExists = await Proxy.findOne({ ip: proxyData.ip, port: proxyData.port });
      if (!proxyExists) {
        const proxy = new Proxy(proxyData);
        await proxy.save();
        console.log(`✅ تم إنشاء بروكسي: ${proxyData.ip}:${proxyData.port}`);
      }
    }
    
    console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!');
    console.log('\n📋 ملخص الجداول المنشأة:');
    console.log('   👥 جدول المستخدمين (Users)');
    console.log('   📦 جدول الطلبات (Orders)');
    console.log('   🍪 جدول الكوكيز (Cookies)');
    console.log('   🌐 جدول البروكسيات (Proxies)');
    console.log('   💰 جدول العروض (Offers)');
    
    console.log('\n👤 حساب المشرف:');
    console.log('   البريد الإلكتروني: admin@facebook-automation.com');
    console.log('   كلمة المرور: admin123456');
    
    console.log('\n🚀 يمكنك الآن تشغيل المشروع:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// Run the setup
setupDatabase(); 