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
          '--disable-gpu'
        ]
      });
      logger.info('Browser initialized successfully');
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
      await page.goto(postUrl, { waitUntil: 'networkidle2' });
      
      // البحث عن زر الإعجاب
      const likeButton = await page.$('[aria-label="Like"]') || 
                        await page.$('[aria-label="أعجبني"]') ||
                        await page.$('button[data-testid="like-button"]');
      
      if (likeButton) {
        await likeButton.click();
        logger.info('Post liked successfully');
        return true;
      } else {
        logger.warn('Like button not found');
        return false;
      }
    } catch (error) {
      logger.error('Failed to like post:', error);
      return false;
    }
  }

  async commentOnPost(page, postUrl, comment) {
    try {
      await page.goto(postUrl, { waitUntil: 'networkidle2' });
      
      // البحث عن مربع التعليق
      const commentBox = await page.$('[aria-label="Write a comment"]') ||
                        await page.$('[aria-label="اكتب تعليقاً"]') ||
                        await page.$('div[contenteditable="true"]');
      
      if (commentBox) {
        await commentBox.click();
        await page.keyboard.type(comment);
        
        // البحث عن زر الإرسال
        const sendButton = await page.$('[aria-label="Post"]') ||
                          await page.$('[aria-label="إرسال"]') ||
                          await page.$('button[data-testid="comment-composer-post-button"]');
        
        if (sendButton) {
          await sendButton.click();
          logger.info('Comment posted successfully');
          return true;
        }
      }
      
      logger.warn('Comment box or send button not found');
      return false;
    } catch (error) {
      logger.error('Failed to comment on post:', error);
      return false;
    }
  }

  async followPage(page, pageUrl) {
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle2' });
      
      // البحث عن زر المتابعة
      const followButton = await page.$('[aria-label="Follow"]') ||
                          await page.$('[aria-label="متابعة"]') ||
                          await page.$('button[data-testid="follow-button"]');
      
      if (followButton) {
        await followButton.click();
        logger.info('Page followed successfully');
        return true;
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
      
      // تهيئة المتصفح
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // تطبيق الكوكيز
      await this.applyCookies(page, cookie.cookie);
      
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
          'أفكار رائعة! 🎯'
        ];

        for (let i = 0; i < order.comments; i++) {
          const comment = comments[Math.floor(Math.random() * comments.length)];
          const success = await this.commentOnPost(page, order.targetUrl, comment);
          if (success) {
            successCount++;
            results.push({ type: 'comment', success: true });
          } else {
            results.push({ type: 'comment', success: false });
          }
          await this.randomDelay(3000, 7000);
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

      // إغلاق المتصفح
      await this.browser.close();
      this.browser = null;

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
        await this.browser.close();
        this.browser = null;
      }

      this.isRunning = false;
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

      const pendingOrders = await Order.find({ status: 'pending' })
        .populate('userId', 'email')
        .sort({ createdAt: 1 });

      logger.info(`Found ${pendingOrders.length} pending orders with ${availableCookies} available cookies`);

      for (const order of pendingOrders) {
        try {
          await this.executeOrder(order);
          // انتظار بين الطلبات
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
    } catch (error) {
      logger.error('Failed to process pending orders:', error);
    }
  }

  startAutomation() {
    // تشغيل معالج الطلبات كل 30 ثانية
    setInterval(() => {
      this.processPendingOrders();
    }, 30000);

    logger.info('Automation service started');
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