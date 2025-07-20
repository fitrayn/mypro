const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎯 إعداد MongoDB Atlas للفيس بوك أوتوميشن');
console.log('=====================================\n');

rl.question('أدخل username الخاص بـ MongoDB Atlas: ', (username) => {
  rl.question('أدخل password الخاص بـ MongoDB Atlas: ', (password) => {
    rl.question('أدخل cluster name (مثال: cluster0): ', (clusterName) => {
      
      const connectionString = `mongodb+srv://${username}:${password}@${clusterName}.mongodb.net/facebook-automation?retryWrites=true&w=majority`;
      
      console.log('\n✅ تم إنشاء Connection String:');
      console.log('=====================================');
      console.log(connectionString);
      console.log('\n📝 قم بنسخ هذا الرابط وتحديث ملف .env');
      console.log('🔧 أو استخدم الأمر التالي لتحديث الملف تلقائياً:');
      console.log(`echo MONGODB_URI=${connectionString} > .env`);
      
      rl.question('\nهل تريد تحديث ملف .env تلقائياً؟ (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          const fs = require('fs');
          const envContent = `PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=${connectionString}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Redis Configuration (for future caching)
# REDIS_URL=redis://localhost:6379

# Optional: Email Configuration (for password reset)
# SMTP_PASS=your-app-password
`;
          
          fs.writeFileSync('.env', envContent);
          console.log('✅ تم تحديث ملف .env بنجاح!');
        }
        
        console.log('\n🚀 يمكنك الآن تشغيل المشروع:');
        console.log('npm run dev');
        
        rl.close();
      });
    });
  });
}); 