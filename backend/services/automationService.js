const puppeteer = require('puppeteer');
const Cookie = require('../models/Cookie');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const axios = require('axios');

class AutomationService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
  }

  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 30000
      });
      logger.info('Browser initialized successfully for Render environment');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async getWorkingCookie() {
    try {
      // البحث عن كوكي عامل مع أقل استخدام
      const cookie = await Cookie.findOne({ status: 'active' })
        .sort({ usageCount: 1, lastUsed: 1 });
      
      if (!cookie) {
        throw new Error('No working cookies available');
      }
      
      logger.info(`Selected cookie: ${cookie._id} with ${cookie.usageCount} uses`);
      return cookie;
    } catch (error) {
      logger.error('Failed to get working cookie:', error);
      throw error;
    }
  }

  async applyCookies(page, cookieString) {
    try {
      const cookies = this.parseCookieString(cookieString);
      await page.setCookie(...cookies);
      logger.info('Cookies applied successfully');
    } catch (error) {
      logger.error('Failed to apply cookies:', error);
      throw error;
    }
  }

  parseCookieString(cookieString) {
    const cookies = [];
    const lines = cookieString.split(';');
    
    for (const line of lines) {
      const [name, value] = line.trim().split('=');
      if (name && value) {
        cookies.push({
          name: name.trim(),
          value: value.trim(),
          domain: '.facebook.com',
          path: '/'
        });
      }
    }
    
    return cookies;
  }

  async likePost(page, postUrl) {
    try {
      await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // انتظار إضافي للتأكد من تحميل الصفحة
      await page.waitForTimeout(3000);
      
      // محاولات متعددة للعثور على زر الإعجاب
      const likeSelectors = [
        '[aria-label="Like"]',
        '[aria-label="أعجبني"]',
        'button[data-testid="like-button"]',
        '[data-testid="like-button"]',
        'div[role="button"][tabindex="0"]',
        'button[type="submit"]',
        'div[aria-label*="Like"]',
        'div[aria-label*="أعجبني"]'
      ];

      let likeButton = null;
      
      for (const selector of likeSelectors) {
        try {
          likeButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (likeButton) {
            // التحقق من أن الزر قابل للنقر
            const isVisible = await likeButton.isVisible();
            if (isVisible) {
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (likeButton) {
        // التمرير إلى الزر إذا كان خارج الشاشة
        await likeButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // النقر على الزر
        await likeButton.click();
        
        // انتظار للتأكد من نجاح العملية
        await page.waitForTimeout(2000);
        
        // التحقق من تغيير حالة الزر
        const isLiked = await page.evaluate(() => {
          const likeButton = document.querySelector('[aria-label="Unlike"]') || 
                           document.querySelector('[aria-label="إلغاء الإعجاب"]');
          return !!likeButton;
        });
        
        if (isLiked) {
          logger.info('Post liked successfully');
          return true;
        } else {
          logger.warn('Like action may not have been successful');
          return false;
        }
      } else {
        logger.warn('Like button not found with any selector');
        return false;
      }
    } catch (error) {
      logger.error('Failed to like post:', error);
      return false;
    }
  }

  async commentOnPost(page, postUrl, comment) {
    try {
      await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // انتظار إضافي للتأكد من تحميل الصفحة
      await page.waitForTimeout(3000);
      
      // البحث عن مربع التعليق
      const commentSelectors = [
        '[aria-label="Write a comment"]',
        '[aria-label="اكتب تعليقاً"]',
        'div[contenteditable="true"]',
        '[data-testid="comment-composer"]',
        'div[role="textbox"]',
        'textarea[placeholder*="comment"]',
        'textarea[placeholder*="تعليق"]'
      ];

      let commentBox = null;
      
      for (const selector of commentSelectors) {
        try {
          commentBox = await page.waitForSelector(selector, { timeout: 5000 });
          if (commentBox) {
            const isVisible = await commentBox.isVisible();
            if (isVisible) {
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (commentBox) {
        // التمرير إلى مربع التعليق
        await commentBox.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // النقر على مربع التعليق
        await commentBox.click();
        await page.waitForTimeout(1000);
        
        // مسح أي نص موجود
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        
        // كتابة التعليق
        await page.keyboard.type(comment);
        await page.waitForTimeout(1000);
        
        // البحث عن زر الإرسال
        const sendSelectors = [
          '[aria-label="Post"]',
          '[aria-label="إرسال"]',
          'button[data-testid="comment-composer-post-button"]',
          'button[type="submit"]',
          'div[role="button"][tabindex="0"]',
          'button:has-text("Post")',
          'button:has-text("إرسال")'
        ];

        let sendButton = null;
        
        for (const selector of sendSelectors) {
          try {
            sendButton = await page.waitForSelector(selector, { timeout: 3000 });
            if (sendButton) {
              const isVisible = await sendButton.isVisible();
              if (isVisible) {
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        if (sendButton) {
          // النقر على زر الإرسال
          await sendButton.click();
          
          // انتظار للتأكد من إرسال التعليق
          await page.waitForTimeout(3000);
          
          // التحقق من نجاح إرسال التعليق
          const commentSent = await page.evaluate((commentText) => {
            const comments = document.querySelectorAll('[data-testid="comment"]');
            for (const commentElement of comments) {
              if (commentElement.textContent.includes(commentText)) {
                return true;
              }
            }
            return false;
          }, comment);
          
          if (commentSent) {
            logger.info('Comment posted successfully');
            return true;
          } else {
            logger.warn('Comment may not have been posted successfully');
            return false;
          }
        } else {
          logger.warn('Send button not found');
          return false;
        }
      } else {
        logger.warn('Comment box not found');
        return false;
      }
    } catch (error) {
      logger.error('Failed to comment on post:', error);
      return false;
    }
  }

  async followPage(page, pageUrl) {
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // انتظار إضافي للتأكد من تحميل الصفحة
      await page.waitForTimeout(3000);
      
      // البحث عن زر المتابعة
      const followSelectors = [
        '[aria-label="Follow"]',
        '[aria-label="متابعة"]',
        'button[data-testid="follow-button"]',
        'button:has-text("Follow")',
        'button:has-text("متابعة")',
        'div[role="button"][tabindex="0"]',
        'button[type="submit"]'
      ];

      let followButton = null;
      
      for (const selector of followSelectors) {
        try {
          followButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (followButton) {
            const isVisible = await followButton.isVisible();
            if (isVisible) {
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (followButton) {
        // التمرير إلى الزر
        await followButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // النقر على الزر
        await followButton.click();
        
        // انتظار للتأكد من نجاح العملية
        await page.waitForTimeout(2000);
        
        // التحقق من تغيير حالة الزر
        const isFollowing = await page.evaluate(() => {
          const followingButton = document.querySelector('[aria-label="Following"]') || 
                                document.querySelector('[aria-label="متابَع"]');
          return !!followingButton;
        });
        
        if (isFollowing) {
          logger.info('Page followed successfully');
          return true;
        } else {
          logger.warn('Follow action may not have been successful');
          return false;
        }
      } else {
        logger.warn('Follow button not found');
        return false;
      }
    } catch (error) {
      logger.error('Failed to follow page:', error);
      return false;
    }
  }

  async updateOrderStatus(orderId, status, results = null, successCount = 0, error = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // تحديث حالة الطلب
      order.status = status;
      if (results) order.results = results;
      if (successCount !== undefined) order.successCount = successCount;
      if (error) order.error = error;
      
      if (status === 'running') {
        order.startedAt = new Date();
      } else if (status === 'done' || status === 'failed' || status === 'cancelled') {
        order.completedAt = new Date();
      }

      await order.save();
      logger.info(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      logger.error('Failed to update order status:', error);
      throw error;
    }
  }

  async executeOrder(order) {
    try {
      if (this.isRunning) {
        throw new Error('Automation service is already running');
      }

      this.isRunning = true;
      logger.info(`Starting order execution: ${order._id}`);

      // تحديث حالة الطلب إلى running
      await this.updateOrderStatus(order._id, 'running');

      // الحصول على كوكي عامل
      const cookie = await this.getWorkingCookie();
      
      // تهيئة المتصفح مع إعدادات محسنة
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // إعدادات إضافية للصفحة - محسنة لـ Render
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // تحسينات إضافية لـ Render
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // منع تحميل الصور والوسائط لتوفير الموارد
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // تعيين timeout أقصر لـ Render
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(20000);
      
      // تطبيق الكوكيز
      await this.applyCookies(page, cookie.cookie);
      
      // التحقق من تسجيل الدخول
      await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const isLoggedIn = await page.evaluate(() => {
        return !document.querySelector('[data-testid="royal_login_button"]') && 
               !document.querySelector('[aria-label="Log in to Facebook"]');
      });
      
      if (!isLoggedIn) {
        throw new Error('User not logged in with provided cookies');
      }
      
      logger.info('Successfully logged in with cookies');
      
      let successCount = 0;
      const results = [];

      // تنفيذ الإعجابات
      if (order.likes > 0) {
        for (let i = 0; i < order.likes; i++) {
          const success = await this.likePost(page, order.targetUrl);
          if (success) {
            successCount++;
            results.push({ type: 'like', success: true });
          } else {
            results.push({ type: 'like', success: false });
          }
          // انتظار عشوائي لتجنب الحظر
          await this.randomDelay(2000, 5000);
        }
      }

      // تنفيذ التعليقات
      if (order.comments > 0) {
        const comments = [
          'محتوى رائع! 👍',
          'أحسنت! 🌟',
          'ممتاز! 👏',
          'جميل جداً! 💫',
          'أفكار رائعة! 🎯',
          'محتوى مفيد جداً! 📚',
          'شكراً للمشاركة! 🙏',
          'معلومات قيمة! 💡',
          'أداء ممتاز! ⭐',
          'محتوى أصيل! 🎨',
          'مفيد جداً! 🔥',
          'أحسنت على هذا المحتوى! 🎉',
          'ممتاز جداً! 🌟',
          'محتوى رائع ومفيد! 📖',
          'أفكار مميزة! 💎',
          'محتوى قيم! 🏆',
          'أداء رائع! 🎯',
          'معلومات مفيدة! 📝',
          'محتوى أصيل ومفيد! 🎭',
          'أحسنت على هذا العمل! 🏅'
        ];

        for (let i = 0; i < order.comments; i++) {
          // اختيار تعليق عشوائي مع تجنب التكرار
          const usedComments = results.filter(r => r.type === 'comment' && r.comment).map(r => r.comment);
          const availableComments = comments.filter(c => !usedComments.includes(c));
          const comment = availableComments.length > 0 
            ? availableComments[Math.floor(Math.random() * availableComments.length)]
            : comments[Math.floor(Math.random() * comments.length)];
          
          const success = await this.commentOnPost(page, order.targetUrl, comment);
          if (success) {
            successCount++;
            results.push({ type: 'comment', success: true, comment });
          } else {
            results.push({ type: 'comment', success: false, comment });
          }
          
          // انتظار عشوائي أطول للتعليقات لتجنب الحظر
          await this.randomDelay(5000, 10000);
        }
      }

      // تنفيذ المتابعات
      if (order.follows > 0) {
        for (let i = 0; i < order.follows; i++) {
          const success = await this.followPage(page, order.targetUrl);
          if (success) {
            successCount++;
            results.push({ type: 'follow', success: true });
          } else {
            results.push({ type: 'follow', success: false });
          }
          await this.randomDelay(2000, 5000);
        }
      }

      // إغلاق المتصفح مع تنظيف الذاكرة
      if (this.browser) {
        const pages = await this.browser.pages();
        for (const page of pages) {
          try {
            await page.close();
          } catch (e) {
            logger.warn('Failed to close page:', e);
          }
        }
        await this.browser.close();
        this.browser = null;
        
        // تنظيف الذاكرة
        if (global.gc) {
          global.gc();
        }
      }

      // تحديث حالة الطلب النهائية
      const finalStatus = successCount > 0 ? 'done' : 'failed';
      await this.updateOrderStatus(order._id, finalStatus, results, successCount);

      // تحديث استخدام الكوكي
      await Cookie.findByIdAndUpdate(cookie._id, {
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      });

      logger.info(`Order ${order._id} completed with ${successCount} successful actions`);
      this.isRunning = false;

      return {
        success: true,
        successCount,
        results
      };

    } catch (error) {
      logger.error(`Order execution failed: ${order._id}`, error);
      
      // تحديث حالة الطلب إلى فشل
      await this.updateOrderStatus(order._id, 'failed', null, 0, error.message);

      if (this.browser) {
        try {
          const pages = await this.browser.pages();
          for (const page of pages) {
            try {
              await page.close();
            } catch (e) {
              logger.warn('Failed to close page during error:', e);
            }
          }
          await this.browser.close();
        } catch (closeError) {
          logger.error('Failed to close browser during error:', closeError);
        }
        this.browser = null;
        
        // تنظيف الذاكرة في حالة الخطأ
        if (global.gc) {
          global.gc();
        }
      }

      this.isRunning = false;
      
      // إعادة تشغيل الخدمة بعد فترة إذا كان الخطأ بسبب مشاكل تقنية
      if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
        setTimeout(() => {
          this.isRunning = false;
          logger.info('Automation service reset after browser error');
        }, 10000);
      }
      
      throw error;
    }
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async processPendingOrders() {
    try {
      // التحقق من وجود كوكيز متاحة
      const availableCookies = await Cookie.countDocuments({ status: 'active' });
      if (availableCookies === 0) {
        logger.warn('No active cookies available, skipping order processing');
        return;
      }

      // تحديد عدد الطلبات للمعالجة في المرة الواحدة لتوفير الموارد
      const maxOrdersPerBatch = process.env.NODE_ENV === 'production' ? 3 : 10;
      
      const pendingOrders = await Order.find({ status: 'pending' })
        .populate('userId', 'email')
        .sort({ createdAt: 1 })
        .limit(maxOrdersPerBatch);

      logger.info(`Found ${pendingOrders.length} pending orders with ${availableCookies} available cookies (processing max ${maxOrdersPerBatch})`);

      for (const order of pendingOrders) {
        try {
          await this.executeOrder(order);
          // انتظار بين الطلبات - أطول في الإنتاج
          const delay = process.env.NODE_ENV === 'production' ? 
            await this.randomDelay(10000, 20000) : 
            await this.randomDelay(5000, 10000);
        } catch (error) {
          logger.error(`Failed to process order ${order._id}:`, error);
          
          // إذا كان الخطأ بسبب عدم وجود كوكيز، نتوقف عن معالجة الطلبات
          if (error.message.includes('No working cookies available')) {
            logger.error('No working cookies available, stopping order processing');
            break;
          }
        }
      }
      
      // تنظيف الذاكرة بعد معالجة الطلبات
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      logger.error('Failed to process pending orders:', error);
    }
  }

  startAutomation() {
    // تشغيل معالج الطلبات كل 60 ثانية على Render لتوفير الموارد
    const interval = process.env.NODE_ENV === 'production' ? 60000 : 30000;
    
    setInterval(() => {
      this.processPendingOrders();
    }, interval);

    logger.info(`Automation service started with ${interval/1000}s interval`);
  }

  // تشغيل تلقائي عند بدء البرنامج
  autoStart() {
    // بدء التطبيق التلقائي بعد 10 ثواني من تشغيل البرنامج
    setTimeout(() => {
      this.startAutomation();
      logger.info('Automation service auto-started');
    }, 10000);
  }
}

module.exports = new AutomationService(); 