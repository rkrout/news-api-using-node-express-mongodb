const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true 
    },
    comment: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.ObjectId,
        required: true
    },
    newsId: {
        type: mongoose.ObjectId,
        required: true
    },
    commentedAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Comment', commentSchema)