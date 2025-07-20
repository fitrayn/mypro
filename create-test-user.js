const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');

async function createTestUser() {
  try {
    console.log('🔗 جاري الاتصال بقاعدة البيانات...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // Create test user
    console.log('👤 جاري إنشاء مستخدم تجريبي...');
    
    const testUserExists = await User.findOne({ email: 'test@example.com' });
    
    if (!testUserExists) {
      const testUser = new User({
        email: 'test@example.com',
        password: 'test123456',
        wallet: 500,
        isAdmin: false
      });
      
      await testUser.save();
      console.log('✅ تم إنشاء المستخدم التجريبي:');
      console.log('   البريد الإلكتروني: test@example.com');
      console.log('   كلمة المرور: test123456');
      console.log('   المحفظة: $500');
    } else {
      console.log('ℹ️ المستخدم التجريبي موجود بالفعل');
    }
    
    console.log('\n📋 معلومات الحسابات المتاحة:');
    console.log('\n👤 حساب المشرف:');
    console.log('   البريد الإلكتروني: admin@facebook-automation.com');
    console.log('   كلمة المرور: admin123456');
    console.log('   الصلاحيات: مشرف كامل');
    
    console.log('\n👤 حساب المستخدم العادي:');
    console.log('   البريد الإلكتروني: test@example.com');
    console.log('   كلمة المرور: test123456');
    console.log('   المحفظة: $500');
    
    console.log('\n🚀 يمكنك الآن تشغيل المشروع:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم التجريبي:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

createTestUser(); 