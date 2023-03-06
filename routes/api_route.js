const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../model");

const { returnFiles, validateCookie, removeRejectedFile } = require("../helper/helper")



const storage = multer.diskStorage({
    destination: "public/uploads",
    filename: function (req, file, cb) {
        cb(null, 'file' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        let validextensions = ['.png', '.jpg', '.jpeg'];
        let ext = path.extname(file.originalname);
        if (!validextensions.includes(ext)) {
            return cb(new Error(" Please choose supported format"))
        }

        cb(null, true);
    },
    limits: {
        fileSize: 125000 * 10
    }
})



// Route for registration
router.post("/sign-up", async (req, res) => {
    const { email, password } = req.body;
    if(!email && !password) return res.status(400).send({ message: "Error with request"})

    try {
        const exist = await User.findOne({ email })
        if (exist) return res.send({ message: "User exists" })
    
        let newUser = new User({ email, password })
    
        await newUser.save()
        res.status(200).send({ message: "Register Successful", newUser })
    } catch (error) {
        res.status(500).send({ message: "Error with request"})
    }
})

// Route for Login
router.post("/sign-in", async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).send({ message: "Error with request"})

    try {
        const exists = await User.findOne({ email })
        if (!exists) return res.send({ message: "User does not exist" })
    
        let thirtyMins = 30 * 60 * 60 * 1000;

        res.cookie('jwt', exists._id, { httpOnly: true, maxAge: thirtyMins})
        res.status(200).send({ message: "Login successful" })
    } catch (error) {
        res.status(500).send({ message: "Error with request"})
    }
})


// Client route to handle file upload and request bodies
// upload multiple
router.post("/upload-mutiple", validateCookie, async (req, res) => {

    let id = req?.cookies;
    if (!id) return res.status(400).send({ message: "Error with request" })

    let userFilesExist = await User.findOne({ _id: id })
    if (userFilesExist.images.length > 0) return res.status(400).send({ message: "Files already uploaded" })

    upload.array('file', 3)(req, res, async (err) => {

        if (err) return res.status(400).send({ message: err })

        try {

            // request body
            let {
                firstname,
                surname,
                lastname,
                state,
                address,
                dob
            } = req?.body;

            // waec file request object
            let waecObj = {
                id: 'waec',
                originalname: req.files[0]?.originalname,
                encoding: req.files[0]?.encoding,
                mimetype: req.files[0]?.mimetype,
                filename: req.files[0]?.filename,
                path: req.files[0]?.path
            }

            // neco file request object
            let necoObj = {
                id: 'neco',
                originalname: req.files[1]?.originalname,
                encoding: req.files[1]?.encoding,
                mimetype: req.files[1]?.mimetype,
                filename: req.files[1]?.filename,
                path: req.files[1]?.path
            }

            // utme file request object
            let utmeObj = {
                id: 'utme',
                originalname: req.files[2]?.originalname,
                encoding: req.files[2]?.encoding,
                mimetype: req.files[2]?.mimetype,
                filename: req.files[2]?.filename,
                path: req.files[2]?.path
            }


            await User.updateOne({ _id: id }, {
                firstname,
                surname,
                lastname,
                state,
                address,
                dob,
                images: [
                    waecObj,
                    necoObj,
                    utmeObj
                ]
            })

            return res.status(200).send({ message: "Uploaded multiple files", id })

        } catch (error) {
            res.status(500).send({ message: "Error with request" })
        }
    })
})


// Client route to handle single file upload
// Used to update already uploaded and rejected files
router.post("/upload-single/:fileType", validateCookie, async (req, res) => {

    let id = req?.cookies;
    let { fileType } = req.params; // neco || waec || utme
    if (!id || !fileType) return res.status(400).send({ message: "Error with request" })

    upload.single('file')(req, res, async (err) => {

        if (err) return res.status(400).send({ err })

        try {

            // remove file from local storage then update db
            let user = await User.findOne({ _id: id });
            let userfile = user.images.find(obj => obj.id === fileType)
            removeRejectedFile(userfile.filename)


            let newFile = await User.updateOne({
                _id: id,
                "images.id": fileType
            }, {
                $set: {
                    "images.$.filename": req.file?.filename,
                    "images.$.path": req.file?.path,
                }
            })

            return res.status(200).send({ message: "File has been updated", newFile })

        } catch (error) {
            res.status(500).send({ message: "Error with request", error })
        }
    })
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
        res.status(400).send({ message: "Error with request" })
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


router.get("/logout", (req, res) => {
    res.clearCookie("jwt")
    res.redirect("/login")
})


module.exports = router;