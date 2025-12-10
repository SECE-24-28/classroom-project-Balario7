const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Order = require('./models/Order');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/freshmart';
console.log('Attempting to connect to MongoDB...');

let mongoConnected = false;

mongoose.connect(mongoUri, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    mongoConnected = true;
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.log('⚠ Server will work with fallback in-memory storage');
    mongoConnected = false;
  });

// Fallback in-memory storage if MongoDB is not connected
let users = {};
let orders = [];

// Root API
app.get('/', (req, res) => {
    res.json({ success: true, message: 'FreshMart Backend Server is running' });
});

// Login API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (mongoConnected) {
            // Use MongoDB
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.json({ success: false, message: 'Email not registered. Please sign up first.' });
            }
            
            if (user.password !== password) {
                return res.json({ success: false, message: 'Password is incorrect. Please type the correct password.' });
            }
            
            res.json({ success: true, user: { email: user.email, name: user.name } });
        } else {
            // Fallback to in-memory storage
            if (!users[email]) {
                return res.json({ success: false, message: 'Email not registered. Please sign up first.' });
            }
            
            if (users[email] !== password) {
                return res.json({ success: false, message: 'Password is incorrect. Please type the correct password.' });
            }
            
            res.json({ success: true, user: { email, name: 'User' } });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Signup API
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (mongoConnected) {
            // Use MongoDB
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.json({ success: false, message: 'Email already registered' });
            }
            
            const newUser = new User({ email, password, name: 'User' });
            await newUser.save();
            
            res.json({ success: true, message: 'Account created successfully!' });
        } else {
            // Fallback to in-memory storage
            if (users[email]) {
                return res.json({ success: false, message: 'Email already registered' });
            }
            
            users[email] = password;
            res.json({ success: true, message: 'Account created successfully!' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Products API
app.get('/api/products', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: '5', name: 'Fresh Bananas', price: 40, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=250&h=180&fit=crop', category: 'Fruits' },
            { id: '6', name: 'Fresh Milk', price: 65, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=250&h=180&fit=crop', category: 'Dairy' },
            { id: '7', name: 'Tomatoes', price: 30, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=250&h=180&fit=crop', category: 'Vegetables' },
            { id: '8', name: 'Potatoes', price: 25, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=250&h=180&fit=crop', category: 'Vegetables' },
            { id: '9', name: 'Onions', price: 35, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=250&h=180&fit=crop', category: 'Vegetables' },
            { id: '10', name: 'Carrots', price: 45, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=250&h=180&fit=crop', category: 'Vegetables' },
            { id: '11', name: 'Apples', price: 120, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=250&h=180&fit=crop', category: 'Fruits' },
            { id: '12', name: 'Oranges', price: 80, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=250&h=180&fit=crop', category: 'Fruits' }
        ]
    });
});

// Orders API
app.post('/api/orders', async (req, res) => {
    try {
        const orderId = 'FM' + Date.now();
        
        if (mongoConnected) {
            // Use MongoDB
            const newOrder = new Order({
                orderId,
                email: req.body.email,
                items: req.body.items,
                totalPrice: req.body.totalPrice,
                orderStatus: 'Pending'
            });
            
            await newOrder.save();
            
            res.json({ success: true, orderId, message: 'Order placed successfully!' });
        } else {
            // Fallback to in-memory storage
            orders.push({ orderId, ...req.body });
            res.json({ success: true, orderId, message: 'Order placed successfully!' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
