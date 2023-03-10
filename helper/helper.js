const User = require("../model/index");
const cloudinary = require("cloudinary").v2


const returnFiles = async (id) => {
    try {
        const files = await User.findOne({ _id: id })

        return files.images.map(element => {
            return {
                name: element.id,
                public_id: element.public_id,
                signature: element.signature,
                status: element.status
            }
        })
    } catch (error) {
        throw new Error("Error with request")
    }
}

const validateCookie = async (req, res, next) => {
    try {
        const id = req.headers?.jwt || req.cookies?.jwt;
        if (!id) return res.status(400).send({ message: "cookie not found" })

        const userExists = await User.findOne({ _id: id })
        if (!userExists) {
            res.clearCookie("jwt")
            return res.send({ message: "Register as a new user" })
        }

        req.cookies = userExists._id
        next()
    } catch (err) {
        return res.send(err)
    }
}


const removeRejectedFiles = async (array) => {
    
    try {
        const removed = await cloudinary.api.delete_resources(array)
        return removed
    } catch (error) {
        throw new Error('Cloudinary File Delete Error')
    }

}


module.exports = {
    returnFiles,
    validateCookie,
    removeRejectedFiles
}