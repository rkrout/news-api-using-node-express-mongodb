const router = require('express').Router()
const { requireAdmin } = require('../middlewares/auth')
const Category = require('../models/category')
const News = require('../models/news')
const { Types } = require('mongoose')

router.get('/', async (req, res) => {
    res.json(await Category.find())
})

router.post('/', requireAdmin, async (req, res) => {
    let { name } = req.body

    if (!name) {
        return res.status(400).json('Name is required')
    }

    if (typeof name !== 'string') {
        return res.status(400).json('Name must be characters')
    }

    name = name.trim()

    if (name.length < 2 || name.length > 20) {
        return res.status(400).json('Name must be within 2-20 characters')
    }

    if (await Category.findOne({ name })) {
        return res.status(409).json('Name already exists')
    }

    const category = await Category.create({ name })

    res.status(201).json(category)
})

router.get('/:id/news', async (req, res) => {
    const limit = Number(req.query.limit) || 10
    const skip = Number(req.query.skip) || 0

    const news = await News
        .find({ categoryId: req.params.id })
        .limit(limit)
        .skip(skip)

    res.json(news)
})

router.patch('/:categoryId', requireAdmin, async (req, res) => {
    const { categoryId } = req.params
    let { name } = req.body

    if (!name) {
        return res.status(400).json('Name is required')
    }

    if (typeof name !== 'string') {
        return res.status(400).json('Name must be characters')
    }

    name = name.trim()

    if (name.length < 2 || name.length > 20) {
        return res.status(400).json('Name must be within 2-20 characters')
    }

    if (await Category.findOne({ name, _id: { $ne: categoryId } })) {
        return res.status(409).json('Name already exists')
    }

    const category = await Category.findById(categoryId)

    if (!category) {
        return res.status(404).json('Category does not exist')
    }

    category.name = req.body.name
    await category.save()

    res.json('Category saved successfully')
})

router.delete('/:categoryId', requireAdmin, async (req, res) => {
    const { categoryId } = req.params

    if (Types.ObjectId.isValid(categoryId)) {
        await Category.deleteOne({ _id: categoryId })
    }

    res.json('Category deleted successfully')
})

module.exports = router