const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    favoriteCategoryIds: [mongoose.ObjectId],
    favoriteNewsIds: [mongoose.ObjectId]
})

module.exports = mongoose.model('User', userSchema)