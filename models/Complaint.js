const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['Academic', 'Technical', 'Administrative', 'Facility', 'Other'],
        required: true 
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed'],
        default: 'Pending'
    },
    adminResponse: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', complaintSchema);