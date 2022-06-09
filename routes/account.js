const router = require('express').Router()
const User = require('../models/user')
const Comment = require('../models/comment')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { requireAuth } = require('../middlewares/auth')
const News = require('../models/news')
const Category = require('../models/category')
require('dotenv').config()

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const { ACCESS_TOKEN_SECRECT, REFRESH_TOKEN_SECRECT } = process.env

    const user = await User.findOne({ email })

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json('Invalid email or password')
    }

    const payload = {
        _id: user._id,
        isAdmin: user.isAdmin
    }

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRECT, { expiresIn: '1h' })
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRECT)

    return res.json({
        accessToken,
        refreshToken
    })
})

router.post('/forgot-password-link', async (req, res) => {
    const { FORGOT_PASSWORD_SECRECT } = process.env

    const { email } = req.body

    if (!email) {
        return res.status(400).json('Email is required')
    }

    if (!await User.findOne({ email })) {
        return res.status(400).json('Email does not exists')
    }

    const token = jwt.sign({ email }, FORGOT_PASSWORD_SECRECT, { expiresIn: '1h' })

    console.log(token)

    res.json('Email send successfully')
})

router.patch('/forgot-password/:token', async (req, res) => {
    let { newPassword } = req.body
    const { token } = req.params
    const { FORGOT_PASSWORD_SECRECT } = process.env

    const { email } = jwt.verify(token, FORGOT_PASSWORD_SECRECT)

    if (!newPassword) {
        return res.status(400).json('New password is required')
    }

    if (typeof newPassword !== 'string') {
        return res.status(400).json('Invalid new password')
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
        return res.status(400).json('New password must be within 8-20 characters')
    }

    newPassword = await bcrypt.hash(newPassword, 10)

    await User.findOneAndUpdate({ email }, { $set: { password: newPassword } })

    res.json('Password changed successfully')
})

router.post('/sign-up-link', async (req, res) => {
    const { email } = req.body

    const { SIGN_UP_SECRECT } = process.env

    if (!email) {
        return res.status(400).json('Email is required')
    }

    const token = jwt.sign({ email }, SIGN_UP_SECRECT, { expiresIn: '1h' })

    console.log(token)

    res.json('Link send successfully')
})

router.post('/sign-up/:token', async (req, res) => {
    let { name, password } = req.body
    const { token } = req.params
    const { SIGN_UP_SECRECT } = process.env

    const { email } = jwt.verify(token, SIGN_UP_SECRECT)

    if (!name) {
        return res.status(400).json('Name is required')
    }

    if (typeof name !== 'string') {
        return res.status(400).json('Name must be characters')
    }

    name = name.trim()

    if (name.length < 2 || name.length > 60) {
        return res.status(400).json('Name must be within 2-60 characters')
    }

    if (!email) {
        return res.status(400).json('Email is required')
    }

    if (await User.findOne({ email })) {
        return res.status(409).json('Email already taken')
    }

    if (!password) {
        return res.status(400).json('Password is required')
    }

    if (typeof password !== 'string') {
        return res.status(400).json('Password must be characters')
    }

    if (password.length < 2 || password.length > 60) {
        return res.status(400).json('Password must be within 2-60 characters')
    }

    password = await bcrypt.hash(password, 10)

    let user = await User.create({
        name,
        email,
        password
    })

    user = user.toObject()

    delete user.password

    res.status(201).json(user)
})

router.patch('/change-password', requireAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const { _id } = req.local

    if (!oldPassword) {
        return res.status(400).json('Old password is required')
    }

    if (typeof oldPassword !== 'string') {
        return res.status(400).json('Invalid old password')
    }

    if (!newPassword) {
        return res.status(400).json('New password is required')
    }

    if (typeof newPassword !== 'string') {
        return res.status(400).json('New password must be characters')
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
        return res.status(400).json('Old password must be within 2-20 characters')
    }

    const user = await User.findById(_id)

    if (!await bcrypt.compare(oldPassword, user.password)) {
        return res.status(400).json('Password does not match')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    return res.json('Password changed successfully')
})

router.patch('/change-email-link', requireAuth, async (req, res) => {
    const { email, password } = req.body
    const { _id } = req.local
    const { CHANGE_EMAIL_SECRECT } = process.env

    if (!email) {
        return res.status(400).json('Email is required')
    }

    if (typeof email !== 'string') {
        return res.status(400).json('Invalid email')
    }

    if (!password) {
        return res.status(400).json('Password is required')
    }

    if (typeof password !== 'string') {
        return res.status(400).json('Invalid password')
    }

    const user = await User.findById(_id)

    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json('Password does not match')
    }

    const token = jwt.sign({ email }, CHANGE_EMAIL_SECRECT, { expiresIn: '1h' })

    console.log(token)

    res.json('Email sent successfully')
})

router.patch('/change-email/:token', requireAuth, async (req, res) => {
    const { CHANGE_EMAIL_SECRECT } = process.env
    const { _id } = req.local
    const { token } = req.params

    const { email } = jwt.verify(token, CHANGE_EMAIL_SECRECT)

    if (await User.findOne({ email, _id: { $ne: _id } })) {
        return res.status(409).json('Email already taken')
    }

    await User.findOneAndUpdate({ _id }, { $set: { email } })

    res.json('Email changed successfully')
})

router.patch('/edit-account', requireAuth, async (req, res) => {
    const { _id } = req.local
    let { name } = req.body

    if (!name) {
        return res.status(400).json('Name is required')
    }

    if (typeof name !== 'string') {
        return res.status(400).json('Name must be characters')
    }

    name = name.trim()

    if (name.length < 2 || name.length > 40) {
        return res.status(400).json('Name must be within 2-40 characters')
    }

    const user = await User.findById(_id)
    user.name = name
    await user.save()

    await Comment.updateOne({ userId: _id }, { $set: { userName: name } })

    res.json('Account edited successfully')
})

router.patch('/refresh-token', async (req, res) => {
    const { authorization } = req.headers
    const { ACCESS_TOKEN_SECRECT, REFRESH_TOKEN_SECRECT } = process.env

    if (!authorization && !authorization.startsWith('Bearer ')) {
        return res.status(401).json('Unauthenticated')
    }

    const { _id, isAdmin } = jwt.verify(authorization.substring(7, authorization.length), REFRESH_TOKEN_SECRECT)

    const accessToken = jwt.sign({ _id, isAdmin }, ACCESS_TOKEN_SECRECT, { expiresIn: '1h' })

    res.json({ accessToken })
})

router.get('/', requireAuth, async(req, res) => {
    const user = await User.findById(req.local._id)
    
    const { password, ...others } = user.toObject()

    res.json(others)
})

router.get('/favorite-news', requireAuth, async(req, res) => {
    const { _id } = req.local
    let { limit, skip } = req.query

    limit = Number(limit) || 10
    skip = Number(skip) || 0

    const user = await User.findById(_id)
    const newsIds = user.favoriteNewsIds

    const news = await News 
        .find({_id: {$in: newsIds}})
        .sort({createdAt: -1})
        .limit(limit)
        .skip(skip)

    res.json(news)
})

router.post('/favorite-news/:newsId', requireAuth, async (req, res) => {
    const { newsId } = req.params
    const { _id } = req.local

    if (!await News.findById(newsId)) {
        return res.status(404).json('News does not exists')
    }

    if (await User.findOne({ _id, favoriteNewsIds: { $elemMatch: {newsId } } })) {
        return res.status(409).json('Already added to favorie list')
    }

    await User.findByIdAndUpdate(_id, { $push: { favoriteNewsIds: newsId } })

    return res.status(201).json('Added to favorite list successfully')
})

router.delete('/favorite-news/:newId', requireAuth, async (req, res) => {
    const { newsId } = req.params
    const { _id } = req.local

    await User.findByIdAndUpdate(_id, { $pull: { favoriteNewsIds: newsId } })

    res.json('Removed from favorite list')
})

router.get('/favorite-categories', requireAuth, async(req, res) => {
    const user = await User.findById(req.local._id)
    res.json(user.favoriteCategoryIds)
})

router.post('/favorite-categories', requireAuth, async (req, res) => {
    const { categoryIds } = req.body
    const { _id } = req.local

    if (!categoryIds) {
        return res.status(400).json('Category ids required')
    }

    if (!Array.isArray(categoryIds)) {
        return res.status(400).json('Category ids must be a array')
    }

    categoryIds.forEach(categoryId => {
        if (typeof categoryId !== 'string') {
            return res.status(400).json('Invalid category id')
        }
    })

    const totalCategories = await Category.find({ _id: { $in: categoryIds } }).count()

    if (totalCategories !== categoryIds.length) {
        return res.status(400).json('Invalid category id')
    }

    await User.findByIdAndUpdate(_id, { $set: { favoriteCategoryIds: categoryIds } })

    res.json('Category ids created successfully')
})

module.exports = router

