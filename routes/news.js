const router = require('express').Router()
const News = require('../models/news')
const Category = require('../models/category')
const { v4 } = require('uuid')
const Comment = require('../models/comment')
const User = require('../models/user')
const path = require('path')
const { unlink } = require('fs/promises')
const { requireAdmin, requireAuth, authenticate } = require('../middlewares/auth')
const { Types } = require('mongoose')
const { rmSync } = require('fs')

router.get('/', authenticate, async (req, res) => {
    const limit = Number(req.query.limit) || 10
    const skip = Number(req.query.offset) || 0
    const { _id } = req.local || {}

    let findCondition = {}

    if (_id) {
        const user = await User.findById(_id)

        const categoryIds = user.categoryIds

        if (categoryIds) {
            findCondition = { categoryId: { $in: categoryIds } }
        }
    }

    const news = await News
        .find(findCondition)
        .select({ description: 0 })
        .limit(limit)
        .sort({ createdAt: -1 })
        .skip(skip)

    res.json(news)
})

router.get('/search/:query', async (req, res) => {
    const { query } = req.query
    const limit = Number(req.query.limit) || 10
    const skip = Number(req.query.skip) || 0

    const news = await News
        .find({ title: query })
        .limit(limit)
        .skip(skip)

    res.json(news)
})

router.post('/', requireAdmin, async (req, res) => {
    let { title, description, categoryId } = req.body
    const { image } = req.files || {}

    if (!title) {
        return res.status(400).json('Title is required')
    }

    if (typeof title !== 'string') {
        return res.status(400).json('Title must be characters')
    }

    title = title.trim()

    if (title.length < 2 || title.length > 60) {
        return res.status(400).json('Title must be within 2-60 characters')
    }

    if (!description) {
        return res.status(400).json('Description is required')
    }

    if (typeof description !== 'string') {
        return res.status(400).json('Description must be characters')
    }

    description = description.trim()

    if (description.length < 2 || description.length > 60) {
        return res.status(400).json('Description must be within 2-60 characters')
    }

    if (!categoryId) {
        return res.status(400).json('Category id is required')
    }

    if (typeof categoryId !== 'string') {
        return res.status(400).json('Category id must be characters')
    }

    if (!Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json('Invalid category id')
    }

    if (!await Category.findById(categoryId)) {
        return res.status(400).json('Invalid category id')
    }

    if (!image) {
        return res.status(400).json('Image id is required')
    }

    if (typeof image !== 'object') {
        return res.status(400).json('Invalid image')
    }

    if (image.mimetype !== 'image/png' && image.mimetype !== 'image/jpeg' && image.mimetype !== 'image/jpg') {
        return res.status(400).json('Only jpg, jpeg and png images are allowed')
    }

    if (image.size < 1000 || image.length > 4000) {
        return res.status(400).json('Image must be within 2-4KB')
    }

    const imageName = v4() + path.extname(image.name)
    image.mv(`uploads/${imageName}`)

    const news = await News.create({
        title: title,
        description: description,
        categoryId: categoryId,
        image: imageName
    })

    res.status(201).json(news)
})

router.get('/:newsId', authenticate, async (req, res) => {
    const { newsId } = req.params
    const { _id } = req.local || {}

    if (!Types.ObjectId.isValid(newsId)) {
        return res.status(400).json('Invalid news id')
    }

    let news = await News.findById(newsId)

    let isFavorite = false

    news = news.toObject()

    if (_id) {
        const favoriteNewsIds = await User.findById(_id).favoriteNewsIds
        isFavorite = favoriteNewsIds.contains(news._id)
    }

    res.json({ ...news, isFavorite })
})

router.patch('/:newsId', requireAdmin, async (req, res) => {
    let { title, description, categoryId } = req.body
    const { newsId } = req.params
    const { image } = req.files || {}

    if (!Types.ObjectId.isValid(newsId)) {
        return res.status(400).json('Invalid news id')
    }

    const news = await News.findById(newsId)

    if (!news) {
        return res.status(404).json('News does not exist')
    }

    if (!title) {
        return res.status(400).json('Title is required')
    }

    if (typeof title !== 'string') {
        return res.status(400).json('Title must be characters')
    }

    title = title.trim()

    if (title.length < 2 || title.length > 60) {
        return res.status(400).json('Title must be within 2-60 characters')
    }

    if (!description) {
        return res.status(400).json('Description is required')
    }

    if (typeof description !== 'string') {
        return res.status(400).json('Description must be characters')
    }

    description = description.trim()

    if (description.length < 2 || description.length > 60) {
        return res.status(400).json('Description must be within 2-60 characters')
    }

    if (!categoryId) {
        return res.status(400).json('Category id is required')
    }

    if (typeof categoryId !== 'string') {
        return res.status(400).json('Category id must be characters')
    }

    if (!await Category.findById(categoryId)) {
        return res.status(400).json('Invalid category id')
    }

    if (image) {
        if (typeof image !== 'object') {
            return res.status(400).json('Invalid image')
        }

        if (image.mimetype !== 'image/png' && image.mimetype !== 'image/jpeg' && image.mimetype !== 'image/jpg') {
            return res.status(400).json('Only jpg, jpeg and png images are allowed')
        }

        if (image.size < 1000 || image.length > 4000) {
            return res.status(400).json('Image must be within 2-4KB')
        }

        const imageName = v4() + path.extname(image.name)
        image.mv(`uploads/${imageName}`)
        await unlink(`uploads/${news.image}`)
        news.image = imageName
    }

    news.title = title
    news.description = description
    news.categoryId = categoryId
    await news.save()

    res.json('News updated successfully')
})

router.delete('/:newsId', async (req, res) => {
    const { newsId } = req.params

    if (!Types.ObjectId.isValid(newsId)) {
        return res.status(400).json('Invalid news id')
    }

    const news = await News.findById(newsId)

    if (!news) {
        return res.status(404).json('Invalid news id')
    }

    await unlink(`uploads/${news.image}`)

    await news.delete()

    res.json('News deleted successfully')
})

router.get('/:newsId/comments', authenticate, async (req, res) => {
    const { newsId } = req.params
    const { _id } = req.local || {}

    const limit = Number(req.query.limit) || 10

    const skip = Number(req.query.skip) || 0

    let comments = await Comment
        .find({ newsId })
        .sort({ commentedAt: -1 })
        .limit(limit)
        .skip(skip)

    comments = comments.map(comment => ({
        ...comment.toObject(),
        isCommented: comment.userId.toString() === _id
    }))

    res.json(comments)
})

router.post('/:newsId/comments', requireAuth, async (req, res) => {
    const { newsId } = req.params
    const { _id } = req.local
    let { comment } = req.body

    if (!comment) {
        return res.status(400).json('Comment is required')
    }

    if (typeof comment !== 'string') {
        return res.status(400).json('Comment must be characters')
    }

    comment = comment.trim()

    if (comment.length < 2 || comment.length > 200) {
        return res.status(400).json('Comment must be within 2-200 characters')
    }

    if (!Types.ObjectId.isValid(newsId)) {
        return res.status(400).json('Invalid news id')
    }

    const user = await User.findById(_id)

    if (!await News.findById(newsId)) {
        return res.status(404).json('Post does not exists')
    }

    const newComment = await Comment.create({
        userName: user.name,
        userId: _id,
        newsId,
        comment
    })

    res.status(201).json(newComment)
})

module.exports = router