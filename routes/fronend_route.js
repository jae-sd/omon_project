const express = require("express");
const router = express.Router();
const path = require("path");



const checkCookie = async (req, res, next) => {
    let cookie = req.cookies.jwt
    req.UserId = cookie
    try {
        if (!cookie) return res.redirect("/login")
        next()
    } catch (error) {
        res.status(500).send({ message: "Error with request" })
    }
}

// sign up page
router.get("/register", (req, res) => {
    res.render(path.join(__dirname, "..", "views", "register"))
})


router.get("/login", (req, res) => {
    res.render(path.join(__dirname, "..", "views", "login"))
})


// Client route
router.get("/upload", checkCookie, (req, res) => {
    res.render(path.join(__dirname, "..", "views", "client", "upload_page"), {
        userId: req.UserId
    })
})


router.get("/status/?", checkCookie, (req, res) => {
    res.render(path.join(__dirname, "..", "views", "client", "upload_status_page"))
})


// Render an Admin page
// Admin route that displays a table of recent uploads
router.get("/admin", checkCookie, (req, res) => {
    res.render(path.join(__dirname, "..", "views", "admin", "fetch_all"))
})

// Render 
// Admin route to edit single upload
router.get("/admin/edit/?", checkCookie, (req, res) => {
    res.render(path.join(__dirname, "..", "views", "admin", "fetch_single"))
})




module.exports = router;