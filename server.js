const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

const app = express();

// Import Models
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Event = require('./models/Event');
const FYP = require('./models/FYP');
const Announcement = require('./models/Announcement');

// Import Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const eventRoutes = require('./routes/events');
const fypRoutes = require('./routes/fyp');
const announcementRoutes = require('./routes/announcements');
const dashboardRoutes = require('./routes/dashboard');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_campus', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'System Administrator',
            email: 'admin@cityuniversity.edu',
            password: hashedPassword,
            role: 'admin',
            studentId: 'ADMIN001'
        });
        console.log('Default admin created: admin@cityuniversity.edu / admin123');
    }
}).catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/events', eventRoutes);
app.use('/fyp', fypRoutes);
app.use('/announcements', announcementRoutes);
app.use('/dashboard', dashboardRoutes);

// FYP page route
app.get('/fyp', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('fyp', { title: 'FYP Management', user: req.session.user });
});

// Admin Analytics Page - ADD THIS ROUTE
app.get('/admin/analytics', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-analytics', { title: 'Analytics Dashboard', user: req.session.user });
});

// API route for students
app.get('/api/admin/students', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json({ success: true, students });
    } catch (error) {
        res.json({ success: false, students: [] });
    }
});

// Admin announcements route
app.get('/admin/announcements', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-announcements', { title: 'Admin Announcements', user: req.session.user });
});

// Home Route
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/dashboard/admin');
        } else {
            return res.redirect('/dashboard/student');
        }
    }
    res.render('index', { title: 'Smart Campus Portal' });
});


// Admin standalone management pages - ADD THESE ROUTES
app.get('/admin/announcements', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-announcements-manager', { title: 'Manage Announcements', user: req.session.user });
});

app.get('/admin/events', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-events-manager', { title: 'Manage Events', user: req.session.user });
});

app.get('/admin/complaints', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-complaints-manager', { title: 'Manage Complaints', user: req.session.user });
});

app.get('/admin/fyp', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-fyp-manager', { title: 'Manage FYP Projects', user: req.session.user });
});

app.get('/admin/students', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-students-manager', { title: 'Manage Students', user: req.session.user });
});

// Export report route
app.get('/admin/export-report', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    
    try {
        const complaints = await Complaint.find();
        const events = await Event.find();
        const students = await User.find({ role: 'student' });
        
        let report = 'SMARTCAMPUS ADMIN REPORT\n';
        report += '='.repeat(50) + '\n';
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += `TOTAL STUDENTS: ${students.length}\n`;
        report += `TOTAL COMPLAINTS: ${complaints.length}\n`;
        report += `  - Pending: ${complaints.filter(c => c.status === 'Pending').length}\n`;
        report += `  - Resolved: ${complaints.filter(c => c.status === 'Resolved').length}\n`;
        report += `TOTAL EVENTS: ${events.length}\n`;
        report += `  - Upcoming: ${events.filter(e => new Date(e.date) > new Date()).length}\n`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=smartcampus_report_${new Date().toISOString().split('T')[0]}.txt`);
        res.send(report);
    } catch (error) {
        res.status(500).send('Error generating report');
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});