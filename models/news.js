const mongoose = require('mongoose')

const newsSchema = mongoose.Schema({
    title: {
        type: String,
        required: true 
    },
    description: {
        type: String,
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.ObjectId,
        required: true
    }
})

module.exports = mongoose.model('Recipe', newsSchema)