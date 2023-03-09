const express = require("express");
const router = express.Router();
const User = require("../model");
const cloudinary = require("cloudinary").v2

const cloudinaryConfig = cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.CLOUDAPIKEY,
    api_secret: process.env.CLOUDINARYSECRET,
    secure: true
})

// console.log(cloudinaryConfig.cloud_name)


const { returnFiles, validateCookie, removeRejectedFiles } = require("../helper/helper")




// Route for registration
router.post("/sign-up", async (req, res) => {
    const { email, password } = req.body;
    if (!email && !password) return res.status(400).send({ message: "Error with request" })

    try {
        const exist = await User.findOne({ email })
        if (exist) return res.send({ message: "User exists" })

        let newUser = new User({ email, password })

        await newUser.save()
        res.status(200).send({ message: "Register Successful", newUser })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})

// Route for Login
router.post("/sign-in", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: "Error with request" })

    try {
        const exists = await User.findOne({ email })
        if (!exists) return res.send({ message: "User does not exist" })

        let thirtyMins = 30 * 60 * 60 * 1000;

        res.cookie('jwt', exists._id, { httpOnly: true, maxAge: thirtyMins })
        res.status(200).send({ message: "Login successful" })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})


// Client route to handle file upload and request bodies
// upload multiple
router.post("/upload-mutiple", validateCookie, async (req, res) => {

    let id = req?.cookies;
    if (!id) return res.status(400).send({ message: "Error with request" })

    try {

        // request body
        let {
            firstname,
            surname,
            lastname,
            state,
            address,
            dob
        } = req.body?.profileData

        let files = req.body?.files

        let doesFilesExist = await User.findOne({ _id: id })

        // return an array of users file public_id
        let deletePreviousFiles = doesFilesExist.images.map(items => items.public_id)
        await removeRejectedFiles(deletePreviousFiles)


        await User.updateOne({ _id: id }, {
            firstname,
            surname,
            lastname,
            state,
            address,
            dob,
            images: files
        })


        return res.status(200).send({ message: "Uploaded multiple files", id })

    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})



// Client route to get user's files from database
router.get("/data/:id", async (req, res) => {

    const { id } = req.params;
    if (!id) return res.status(400).send({ message: "No user was passed" })

    try {
        const files = await returnFiles(id)
        let profile = await User.findOne({ _id: id }, {
            email: 1,
            passsword: 1,
            dob: 1,
            firstname: 1,
            surname: 1,
            lastname: 1,
            state: 1,
            address: 1
        })


        return res.status(200).send({ message: "success", data: { files, profile } })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})

// Admin route to get all users
router.get("/admin/all", async (req, res) => {
    try {
        const users = await User.find({}, {
            email: 1,
            updatedAt: 1
        })
        res.status(200).send({ message: "success", users })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})

// Admin route to set approval status on user's files
router.post("/admin/edit/:id/:file", async (req, res) => {
    const { id, file } = req.params;
    const { status } = req.body;

    if (!id || !file || !status) return res.status(400).send({ message: "Error with request" })

    try {
        // file === waec || neco || utme
        // status === accepted || rejected

        const user = await User.updateOne({
            _id: id,
            'images.id': file
        }, {
            $set: {
                'images.$.status': status
            }
        })

        res.status(200).send({ message: "success", user })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }

})

router.get("/get-signature", (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000)
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp
            },
            cloudinaryConfig.api_secret
        )
        res.send({ timestamp, signature })
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
})



router.get("/logout", (req, res) => {
    res.clearCookie("jwt")
    res.redirect("/login")
})


module.exports = router;