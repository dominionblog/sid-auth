const express = require('express')
let router = express.Router()
let moment = require('moment')

const Snippet = require("../models/snippets")

router.get("/feed", async (req, res) => {
    // Find the Snippets
    let snippets = await Snippet.find().populate('author').lean()
    // Order the Snippets
    snippets.sort((a,b) => {
        return b.createdAt - a.createdAt
    })
    // Add the correct date stamps
    res.locals.snippets = snippets.map(snippet => {
        return {
            ...snippet,
            createdAt: moment(snippet.createdAt).format("MMMM Do YYYY")
        }
    })
    // Render the Feed
    res.locals.page = 'feed'
    res.status(200)
    res.render("feed", {res})
})

router.get("/new", (req, res) => {
    delete res.locals.success
    delete res.locals.err
    res.locals.page = 'new'
    res.render("new", {res})
})

router.post("/new", async (req, res) => {
    // Create the Snippet
    try {
        await Snippet.create({
            content: req.body.content,
            author: req.user.get('id')
        })
        // Send the success message
        res.status(200)
        delete res.locals.err
        res.locals.success = "Snippet created"
        res.render("new",{res})
    } catch(err) {
        if (err.name == "ValidationError") {
            res.status(400)
            delete res.locals.success
            res.locals.err = "A snippet must have content"
            return res.render("new",{res})
        }
        res.status(500)
    }
    
})

module.exports = router