const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth'); // THIS IS THE IMPORTANT LINE
const router = express.Router();

// Login Page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login', error: null });
});

// Register Page
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { title: 'Register', error: null });
});

// Register Handler
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, studentId, department, semester, phone } = req.body;
        
        // Validation
        if (password !== confirmPassword) {
            return res.render('register', { title: 'Register', error: 'Passwords do not match' });
        }
        
        const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
        if (existingUser) {
            return res.render('register', { title: 'Register', error: 'User with this email or student ID already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            studentId,
            department,
            semester,
            phone,
            role: 'student'
        });
        
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId
        };
        
        res.redirect('/dashboard/student');
    } catch (error) {
        console.error(error);
        res.render('register', { title: 'Register', error: 'Registration failed. Please try again.' });
    }
});

// Login Handler
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password' });
        }
        
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId
        };
        
        if (user.role === 'admin') {
            res.redirect('/dashboard/admin');
        } else {
            res.redirect('/dashboard/student');
        }
    } catch (error) {
        console.error(error);
        res.render('login', { title: 'Login', error: 'Login failed. Please try again.' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: 'New passwords do not match' });
        }
        
        const user = await User.findById(req.session.user.id);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValid) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.json({ success: false, message: 'Error changing password' });
    }
});

// Update Profile
router.put('/api/update-profile', authMiddleware, async (req, res) => {
    try {
        const { phone, department } = req.body;
        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            { phone, department },
            { new: true }
        );
        
        // Update session
        req.session.user.name = user.name;
        req.session.user.email = user.email;
        
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

module.exports = router;