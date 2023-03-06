const User = require("../model/index");
const fs = require("fs")
const path = require("path")

const returnFiles = async (id) => {
    try {
        const files = await User.findOne({ _id: id })

        return files.images.map(element => {
            return {
                name: element.id,
                originalname: element.originalname,
                filename: element.filename,
                path: element.path,
                status: element.status
            }
        })
    } catch (error) {
        throw new Error("Error with request")
    }
}

const validateCookie = async (req, res, next) => {
    try {
        const id = req.cookies?.jwt;
        if (!id) return res.status(400).send({ message: "Error with request" })

        const userExists = await User.findOne({ _id: id })
        if (!userExists) return res.send({ message: "Error with request" })

        req.cookies = userExists._id
        next()
    } catch (err) {
        return res.send({ message: "Error with request" })
    }
}

// C:\Users\USER\Desktop\Omon Project\helper\helper.js ../, "public", "uploads"
const removeRejectedFile = async (filename) => {
    fs.rm(path.join(__dirname, "..", "public", "uploads", filename), (err) => {
        if(err) return
    })
}


module.exports = {
    returnFiles,
    validateCookie,
    removeRejectedFile
}