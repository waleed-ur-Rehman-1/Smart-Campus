const mongoose = require('mongoose');

const fypSchema = new mongoose.Schema({
    groupName: { type: String, required: true, unique: true },
    members: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: String,
        role: String
    }],
    projectTitle: { type: String, required: true },
    projectDescription: { type: String, required: true },
    domain: { type: String, required: true },
    supervisor: {
        name: String,
        email: String,
        department: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    milestones: [{
        title: String,
        description: String,
        dueDate: Date,
        status: { type: String, enum: ['Pending', 'Completed', 'Late'], default: 'Pending' },
        completedAt: Date
    }],
    documents: [{
        name: String,
        url: String,
        uploadedAt: Date
    }],
    proposalFile: { type: String },
    adminFeedback: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FYP', fypSchema);
