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
        if (!id) return res.status(400).send({ message: "Error with request" })

        const userExists = await User.findOne({ _id: id })
        if (!userExists) return res.send({ message: "Error with request" })

        req.cookies = userExists._id
        next()
    } catch (err) {
        return res.send({ message: "Error with request" })
    }
}


const removeRejectedFiles = async (array) => {
    
    // {
    //     deleted: {
    //       sfp8istpxozegzwvvdem: 'deleted',
    //       fywgggnxh4zqtchrh5vr: 'deleted',
    //       dt5vrv74iixjr9irzec2: 'deleted'
    //     },
    //     deleted_counts: {
    //       sfp8istpxozegzwvvdem: { original: 1, derived: 0 },
    //       fywgggnxh4zqtchrh5vr: { original: 1, derived: 0 },
    //       dt5vrv74iixjr9irzec2: { original: 1, derived: 0 }
    //     },
    //     partial: false,
    //     rate_limit_allowed: 500,
    //     rate_limit_reset_at: 2023-03-08T21:00:00.000Z,
    //     rate_limit_remaining: 498
    // }

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