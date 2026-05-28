const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Event = require('../models/Event');
const FYP = require('../models/FYP');
const Announcement = require('../models/Announcement');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Student Dashboard View
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.session.user.id })
            .sort({ createdAt: -1 })
            .limit(5);
        
        const registeredEvents = await Event.find({
            'registeredStudents.studentId': req.session.user.id
        }).sort({ date: 1 });
        
        const fyp = await FYP.findOne({ 'members.studentId': req.session.user.id });
        
        const announcements = await Announcement.find({
            isActive: true,
            $or: [
                { expiresAt: { $gte: new Date() } },
                { expiresAt: null }
            ]
        }).sort({ priority: -1, createdAt: -1 }).limit(5);
        
        res.render('student-dashboard', {
            title: 'Student Dashboard',
            complaints,
            registeredEvents,
            fyp,
            announcements,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.render('student-dashboard', {
            title: 'Student Dashboard',
            complaints: [],
            registeredEvents: [],
            fyp: null,
            announcements: [],
            user: req.session.user
        });
    }
});

// Admin Dashboard View
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
        const activeEvents = await Event.countDocuments({ date: { $gte: new Date() } });
        const pendingFYP = await FYP.countDocuments({ status: 'Pending' });
        const totalComplaints = await Complaint.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalFYPs = await FYP.countDocuments();
        
        const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5);
        const recentAnnouncements = await Announcement.find().sort({ createdAt: -1 }).limit(5);
        const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
        
        const complaintsByCategory = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        res.render('admin-dashboard', {
            title: 'Admin Dashboard',
            totalStudents,
            pendingComplaints,
            activeEvents,
            pendingFYP,
            totalComplaints,
            totalEvents,
            totalFYPs,
            recentComplaints,
            recentAnnouncements,
            upcomingEvents,
            complaintsByCategory,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.render('admin-dashboard', {
            title: 'Admin Dashboard',
            totalStudents: 0,
            pendingComplaints: 0,
            activeEvents: 0,
            pendingFYP: 0,
            totalComplaints: 0,
            totalEvents: 0,
            totalFYPs: 0,
            recentComplaints: [],
            recentAnnouncements: [],
            upcomingEvents: [],
            complaintsByCategory: [],
            user: req.session.user
        });
    }
});

module.exports = router;