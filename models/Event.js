const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    registeredStudents: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: String,
        registeredAt: { type: Date, default: Date.now }
    }],
    category: { type: String, enum: ['Workshop', 'Seminar', 'Conference', 'Cultural', 'Sports', 'Other'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);