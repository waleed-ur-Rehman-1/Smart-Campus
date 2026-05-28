const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Student: Submit Complaint
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { category, priority, title, description } = req.body;
        
        // Check for duplicate active complaint
        const existingComplaint = await Complaint.findOne({
            studentId: req.session.user.id,
            status: { $in: ['Pending', 'In Progress', 'Escalated'] },
            title: title
        });
        
        if (existingComplaint) {
            return res.json({ success: false, message: 'You already have an active complaint with similar title' });
        }
        
        const complaint = await Complaint.create({
            studentId: req.session.user.id,
            studentName: req.session.user.name,
            category,
            priority,
            title,
            description
        });
        
        res.json({ success: true, complaintId: complaint._id });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error submitting complaint' });
    }
});

// Student: Get My Complaints
router.get('/my-complaints', authMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.session.user.id })
            .sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (error) {
        res.json({ success: false, complaints: [] });
    }
});

// Admin: Get All Complaints
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, priority } = req.query;
        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        
        const complaints = await Complaint.find(query).sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (error) {
        res.json({ success: false, complaints: [] });
    }
});

// Admin: Update Complaint Status
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, response } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        
        if (!complaint) {
            return res.json({ success: false, message: 'Complaint not found' });
        }
        
        complaint.status = status;
        if (response) complaint.adminResponse = response;
        complaint.updatedAt = new Date();
        if (status === 'Resolved') complaint.resolvedAt = new Date();
        
        await complaint.save();
        res.json({ success: true, complaint });
    } catch (error) {
        res.json({ success: false, message: 'Error updating complaint' });
    }
});

// Admin: Escalate Complaint
router.post('/:id/escalate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.json({ success: false, message: 'Complaint not found' });
        }
        
        complaint.status = 'Escalated';
        complaint.adminResponse = req.body.reason || 'Complaint escalated to higher authority';
        await complaint.save();
        
        res.json({ success: true, complaint });
    } catch (error) {
        res.json({ success: false, message: 'Error escalating complaint' });
    }
});

module.exports = router;