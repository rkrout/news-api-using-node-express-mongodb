const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()

mongoose.connect(process.env.MONGO_URL)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())

app.use('/v1/categories', require('./routes/category'))
app.use('/v1/news', require('./routes/news'))
app.use('/v1/account', require('./routes/account'))

app.listen(3001, () => {
    console.log('listening to port 3000....');
})