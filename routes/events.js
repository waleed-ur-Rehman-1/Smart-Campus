const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get All Events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({ date: { $gte: new Date() } })
            .sort({ date: 1 });
        res.json({ success: true, events });
    } catch (error) {
        res.json({ success: false, events: [] });
    }
});

// Admin: Create Event
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, description, date, location, totalSeats, category } = req.body;
        
        const event = await Event.create({
            title,
            description,
            date,
            location,
            totalSeats: parseInt(totalSeats),
            availableSeats: parseInt(totalSeats),
            category
        });
        
        res.json({ success: true, event });
    } catch (error) {
        res.json({ success: false, message: 'Error creating event' });
    }
});

// Student: Register for Event
router.post('/:id/register', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.json({ success: false, message: 'Event not found' });
        }
        
        if (event.availableSeats <= 0) {
            return res.json({ success: false, message: 'Event is full' });
        }
        
        const alreadyRegistered = event.registeredStudents.some(
            s => s.studentId.toString() === req.session.user.id
        );
        
        if (alreadyRegistered) {
            return res.json({ success: false, message: 'You are already registered for this event' });
        }
        
        event.registeredStudents.push({
            studentId: req.session.user.id,
            studentName: req.session.user.name
        });
        event.availableSeats--;
        
        await event.save();
        res.json({ success: true, event });
    } catch (error) {
        res.json({ success: false, message: 'Error registering for event' });
    }
});

// Student: Cancel Registration
router.delete('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.json({ success: false, message: 'Event not found' });
        }
        
        const registrationIndex = event.registeredStudents.findIndex(
            s => s.studentId.toString() === req.session.user.id
        );
        
        if (registrationIndex === -1) {
            return res.json({ success: false, message: 'You are not registered for this event' });
        }
        
        event.registeredStudents.splice(registrationIndex, 1);
        event.availableSeats++;
        
        await event.save();
        res.json({ success: true, event });
    } catch (error) {
        res.json({ success: false, message: 'Error canceling registration' });
    }
});

// Admin: Get Event Registrations
router.get('/:id/registrations', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('registeredStudents.studentId', 'name email studentId');
        res.json({ success: true, registrations: event.registeredStudents });
    } catch (error) {
        res.json({ success: false, registrations: [] });
    }
});

// Admin: Update Event
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, event });
    } catch (error) {
        res.json({ success: false, message: 'Error updating event' });
    }
});

module.exports = router;