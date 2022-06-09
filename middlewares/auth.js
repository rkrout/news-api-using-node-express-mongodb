const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports.requireAdmin = (req, res, next) => {
    const { authorization } = req.headers
    const { ACCESS_TOKEN_SECRECT } = process.env

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json('Unauthorized')
    }

    const { _id, isAdmin } = jwt.verify(authorization.substring(7, authorization.length), ACCESS_TOKEN_SECRECT)

    if (!isAdmin) {
        return res.status(401).json('Unauthorized')
    }

    req.local = { _id }
    next()
}

module.exports.requireAuth = (req, res, next) => {
    const { authorization } = req.headers
    const { ACCESS_TOKEN_SECRECT } = process.env

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json('Unauthorized')
    }

    const { _id } = jwt.verify(authorization.substring(7, authorization.length), ACCESS_TOKEN_SECRECT)
    req.local = { _id }
    next()
}

module.exports.authenticate = (req, res, next) => {
    const { authorization }  = req.headers
    const { ACCESS_TOKEN_SECRECT } = process.env

    if(authorization && authorization.startsWith('Bearer ')){
        const { _id } = jwt.verify(authorization.substring(7, authorization.length), ACCESS_TOKEN_SECRECT)
        req.local = { _id }
    }

    next()
}
