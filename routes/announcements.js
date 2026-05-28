const express = require('express');
const Announcement = require('../models/Announcement');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get All Active Announcements
router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find({
            isActive: true,
            $or: [
                { expiresAt: { $gte: new Date() } },
                { expiresAt: null }
            ]
        }).sort({ priority: -1, createdAt: -1 });
        
        res.json({ success: true, announcements });
    } catch (error) {
        res.json({ success: false, announcements: [] });
    }
});

// Admin: Create Announcement
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, content, priority, category, expiresAt } = req.body;
        
        const announcement = await Announcement.create({
            title,
            content,
            priority,
            category,
            expiresAt: expiresAt || null,
            createdBy: req.session.user.id
        });
        
        res.json({ success: true, announcement });
    } catch (error) {
        res.json({ success: false, message: 'Error creating announcement' });
    }
});

// Admin: Update Announcement
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, announcement });
    } catch (error) {
        res.json({ success: false, message: 'Error updating announcement' });
    }
});

// Admin: Delete Announcement
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Error deleting announcement' });
    }
});

// Admin: Get All Announcements (including inactive)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, announcements });
    } catch (error) {
        res.json({ success: false, announcements: [] });
    }
});

module.exports = router;