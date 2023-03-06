const mongoose = require("mongoose")


const itemSchema = new mongoose.Schema({
    id: {
        type: String
    },
    originalname: {
        type: String
    },
    encoding: {
        type: String
    },
    mimetype: {
        type: String
    },
    filename: {
        type: String
    },
    path: {
        type: String
    },
    status: {
        type: String,
        default: 'accepted'
    }
})

const userSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: {
        type: String
    },
    firstname: {
        type: String
    },
    surname: {
        type: String
    },
    lastname: {
        type: String
    },
    state: {
        type: String
    },
    address: {
        type: String
    },
    dob: {
        type: String
    },
    images: [itemSchema]
})


const User = mongoose.model("user", userSchema)


module.exports = User;