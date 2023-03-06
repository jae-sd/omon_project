const mongoose = require("mongoose")

let mongodbAtlas = `mongodb+srv://jae321:${process.env.DB_PASSWORD}@cluster0.gwvtatj.mongodb.net/omon`;
//let localConnection = "mongodb://localhost:27017/omon";

const connectDb = async (cb) => {

    mongoose.set('strictQuery', true);
    mongoose.connect(mongodbAtlas,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    ).then(res => {
        return cb()
    }).catch(error => {
        return cb(error)
    })
}

module.exports = connectDb