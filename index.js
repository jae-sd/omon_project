require("dotenv").config();

const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser')


// Routes
const { api_route, frontend_route } = require("./routes/index")

const DB = require("./config/db")((error) => {
    if (error) return console.log(error)
    console.log("....Connected to DB....")
    app.listen(PORT, () => console.log(`....Server started....`))
})

const User = require("./model/index")
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));
app.use(cookieParser())

app.use(frontend_route);
app.use(api_route)


