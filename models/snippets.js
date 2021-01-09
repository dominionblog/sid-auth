const mongoose = require("mongoose")

let snippetSchema = new mongoose.Schema({
    content: {type: String, required: true },
    author: {type: mongoose.Types.ObjectId, ref:'user', required: true}
},{timestamps: true})

module.exports = mongoose.model("snippet",snippetSchema)