# Facebook Engagement Automation Platform

A full-stack platform to automate Facebook engagement (likes, follows, comments) using thousands of session cookies. Users can purchase bundles or request custom engagement amounts. Admins can manage cookies, proxies, offers, rate limits, and monitor system performance.

## 🚀 Features

### User Features
- **Authentication**: Secure login/register with JWT tokens
- **Wallet System**: Manage account balance for purchases
- **Bundle Orders**: Choose from predefined engagement packages
- **Custom Orders**: Request specific amounts of likes, comments, follows
- **Order History**: Track all orders with real-time status updates
- **Rate Limiting**: 1 order per 10 minutes per user
- **Profile Management**: Update email and change password

### Admin Features
- **Dashboard**: Comprehensive metrics and system overview
- **User Management**: View users, manage wallets, track activity
- **Cookie Management**: Bulk upload, validate, and monitor Facebook session cookies
- **Proxy Management**: Add, test, and monitor proxy servers
- **Offer Management**: Create and manage engagement packages
- **Order Management**: Monitor and update order statuses
- **System Monitoring**: Real-time performance metrics

### Technical Features
- **Security**: JWT authentication, password hashing, rate limiting
- **Scalability**: Handle thousands of cookies and proxies
- **Reliability**: Retry logic, fallback mechanisms, comprehensive logging
- **Performance**: Optimized database queries, efficient resource management
- **Monitoring**: Detailed logging and error tracking

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Heroicons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Express Validator** - Input validation

### Database
- **MongoDB Atlas** - Cloud database hosting
- **Collections**: Users, Orders, Cookies, Proxies, Offers

## 📁 Project Structure

```
facebook-automation/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── middlewares/     # Authentication & validation
│   ├── utils/           # Utilities (logger, etc.)
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   │   └── admin/   # Admin pages
│   │   └── App.js       # Main app component
│   ├── public/          # Static files
│   └── package.json     # Frontend dependencies
├── package.json         # Root package.json
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facebook-automation
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in root directory
   cp .env.example .env
   ```

   Add the following to your `.env` file:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/facebook-automation
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   # Backend only
   npm run server
   
   # Frontend only
   cd frontend && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String,
  passwordHash: String,
  wallet: Number,
  isAdmin: Boolean,
  lastOrderAt: Date,
  createdAt: Date
}
```

### Orders Collection
```javascript
{
  userId: ObjectId,
  type: 'bundle' | 'custom',
  targetUrl: String,
  likes: Number,
  comments: Number,
  follows: Number,
  status: 'pending' | 'running' | 'done' | 'failed',
  totalCost: Number,
  progress: {
    likesCompleted: Number,
    commentsCompleted: Number,
    followsCompleted: Number
  },
  createdAt: Date
}
```

### Cookies Collection
```javascript
{
  cookie: String,
  status: 'active' | 'dead' | 'needs_verification',
  lastChecked: Date,
  usageCount: Number,
  label: String,
  notes: String
}
```

### Proxies Collection
```javascript
{
  ip: String,
  port: String,
  username: String,
  password: String,
  status: 'working' | 'dead',
  lastTested: Date,
  responseTime: Number,
  country: String
}
```

### Offers Collection
```javascript
{
  title: String,
  description: String,
  likes: Number,
  comments: Number,
  follows: Number,
  price: Number,
  isActive: Boolean,
  category: String,
  deliveryTime: String
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### User Routes
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `PATCH /api/user/password` - Change password
- `GET /api/user/wallet` - Get wallet balance
- `GET /api/user/stats` - Get user statistics

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders/bundle` - Place bundle order
- `POST /api/orders/custom` - Place custom order
- `GET /api/orders/stats/summary` - Get order statistics

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/wallet` - Update user wallet
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status

### Management Routes
- `GET /api/cookies` - Get cookies (admin)
- `POST /api/cookies` - Add cookie (admin)
- `POST /api/cookies/bulk` - Bulk upload cookies (admin)
- `GET /api/proxies` - Get proxies (admin)
- `POST /api/proxies` - Add proxy (admin)
- `GET /api/offers` - Get offers (public)
- `POST /api/offers` - Create offer (admin)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: 1 order per 10 minutes per user
- **Input Validation**: Express-validator for all inputs
- **CORS Protection**: Configured for production
- **Helmet**: Security headers
- **Admin Protection**: Separate admin routes with authorization

## 📈 Performance & Scalability

- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: Ready for Redis integration
- **Error Handling**: Comprehensive error logging
- **Monitoring**: Winston logger for production monitoring

## 🚀 Deployment

### Backend (Render/Heroku)
1. Set environment variables
2. Configure MongoDB Atlas connection
3. Deploy to your preferred platform

### Frontend (Netlify/Vercel)
1. Build the project: `cd frontend && npm run build`
2. Deploy the `build` folder
3. Configure environment variables

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This platform is for educational and demonstration purposes. Users are responsible for complying with Facebook's Terms of Service and applicable laws when using this platform.

## 🆘 Support

For support or questions, please open an issue in the repository or contact the development team.

---

**Note**: This is a demonstration platform. In production, implement additional security measures, proper error handling, and comprehensive testing. 