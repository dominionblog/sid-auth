const mongoose = require('mongoose')
const passportLocalMongoose = require("passport-local-mongoose")

let userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    bio: String
})

userSchema.path('username').validate(val => {
    let pattern = /^[A-Za-z0-9]+(?: +[A-Za-z0-9]+)*$/
    return (val.match(pattern) && (val.length < 20))
},'bad-username')

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('user',userSchema)