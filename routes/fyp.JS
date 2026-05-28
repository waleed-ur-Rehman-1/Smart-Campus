const express = require('express');
const router = express.Router();
const FYP = require('../models/FYP');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Student: Create FYP Group
router.post('/create-group', authMiddleware, async (req, res) => {
    try {
        const { groupName, projectTitle, projectDescription, domain, members } = req.body;
        
        const existingGroup = await FYP.findOne({ groupName });
        if (existingGroup) {
            return res.json({ success: false, message: 'Group name already exists' });
        }
        
        const memberList = [{ studentId: req.session.user.id, studentName: req.session.user.name, role: 'Leader' }];
        
        if (members && members.length > 0) {
            for (let memberEmail of members) {
                const user = await User.findOne({ email: memberEmail, role: 'student' });
                if (user) {
                    memberList.push({
                        studentId: user._id,
                        studentName: user.name,
                        role: 'Member'
                    });
                }
            }
        }
        
        const fyp = await FYP.create({
            groupName,
            projectTitle,
            projectDescription,
            domain,
            members: memberList
        });
        
        res.json({ success: true, fyp });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error creating FYP group' });
    }
});

// Student: Get My FYP
router.get('/my-fyp', authMiddleware, async (req, res) => {
    try {
        const fyp = await FYP.findOne({
            'members.studentId': req.session.user.id
        });
        res.json({ success: true, fyp });
    } catch (error) {
        res.json({ success: false, fyp: null });
    }
});

// Get FYP by ID (for detailed view)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const fyp = await FYP.findById(req.params.id)
            .populate('members.studentId', 'name email studentId');
        
        if (!fyp) {
            return res.status(404).json({ success: false, message: 'FYP not found' });
        }
        
        // Check if user is member or admin
        const isMember = fyp.members.some(m => {
            const memberId = m.studentId?._id || m.studentId;
            return memberId && memberId.toString() === req.session.user.id;
        });
        
        if (!isMember && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        res.json({ success: true, fyp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: Get All FYP Submissions
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const fyps = await FYP.find().sort({ createdAt: -1 });
        res.json({ success: true, fyps });
    } catch (error) {
        res.json({ success: false, fyps: [] });
    }
});

// Admin: Get All FYP Submissions with filters
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, domain } = req.query;
        let query = {};
        if (status) query.status = status;
        if (domain) query.domain = domain;
        
        const fyps = await FYP.find(query)
            .populate('members.studentId', 'name email studentId')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, fyps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: Approve/Reject FYP
router.put('/:id/review', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, feedback, supervisor } = req.body;
        const fyp = await FYP.findById(req.params.id);
        
        if (!fyp) {
            return res.json({ success: false, message: 'FYP not found' });
        }
        
        fyp.status = status;
        fyp.adminFeedback = feedback || '';
        if (supervisor) fyp.supervisor = supervisor;
        fyp.updatedAt = new Date();
        
        await fyp.save();
        res.json({ success: true, fyp });
    } catch (error) {
        res.json({ success: false, message: 'Error reviewing FYP' });
    }
});

// Admin: Assign supervisor to FYP
router.post('/:id/assign-supervisor', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, email, department } = req.body;
        const fyp = await FYP.findById(req.params.id);
        
        if (!fyp) {
            return res.status(404).json({ success: false, message: 'FYP not found' });
        }
        
        fyp.supervisor = { name, email, department };
        fyp.status = 'Approved';
        await fyp.save();
        
        res.json({ success: true, fyp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Student: Add Milestone
router.post('/:id/milestones', authMiddleware, async (req, res) => {
    try {
        const fyp = await FYP.findOne({
            _id: req.params.id,
            'members.studentId': req.session.user.id
        });
        
        if (!fyp) {
            return res.json({ success: false, message: 'FYP not found or access denied' });
        }
        
        fyp.milestones.push(req.body);
        await fyp.save();
        
        res.json({ success: true, fyp });
    } catch (error) {
        res.json({ success: false, message: 'Error adding milestone' });
    }
});

// Student: Update Milestone Status
router.put('/:fypId/milestones/:milestoneId', authMiddleware, async (req, res) => {
    try {
        const fyp = await FYP.findOne({
            _id: req.params.fypId,
            'members.studentId': req.session.user.id
        });
        
        if (!fyp) {
            return res.json({ success: false, message: 'FYP not found or access denied' });
        }
        
        const milestone = fyp.milestones.id(req.params.milestoneId);
        if (milestone) {
            milestone.status = req.body.status;
            if (req.body.status === 'Completed') milestone.completedAt = new Date();
            await fyp.save();
        }
        
        res.json({ success: true, fyp });
    } catch (error) {
        res.json({ success: false, message: 'Error updating milestone' });
    }
});

// Update FYP details
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const fyp = await FYP.findOne({
            _id: req.params.id,
            'members.studentId': req.session.user.id
        });
        
        if (!fyp && req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const updatedFyp = await FYP.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        
        res.json({ success: true, fyp: updatedFyp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;