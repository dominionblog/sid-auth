const express = require('express')
let router = express.Router()
const passport = require('passport')
const User = require("../models/user")
const queryString = require("query-string")

router.post("/register", (req, res) => {
    User.register({
        username: req.body.username
    },req.body.password).then(_ => {
        // Created
        res.status(200)
        delete res.locals.err
        res.locals.success = "Thank you for creating an account! Please log in using your new credentials!"
        res.render("signin",{res})
        // res.render("signin",{res})
    }).catch(err => {
        if (err.name == "ValidationError") {
            res.status(400)
            res.locals.err = "Bad username or password"
            return res.render("index", {res})
        }
        if (err.name == "UserExistsError") {
            res.status(400)
            res.locals.err = "Username already exists"
            return res.render("index", {res})
        }
        if (err.name == "MissingUsernameError") {
            res.status(400)
            res.locals.err = "No username was given"
            return res.render("index", {res})
        }
        if (err.name == "MissingPasswordError") {
            res.status(400)
            res.locals.err = "No password was given"
            return res.render("index", {res})
        }
        res.locals.err = "An unknown error occured"
        res.status(500)
        res.render("index",{res})
    })
})

router.get("/logout", (req, res) => {
    delete res.locals.err
    delete res.locals.success
    res.logout()
    res.status(200)
    res.end()
})

router.get("/login", (req, res) => {
    delete res.locals.err
    delete res.locals.success
    res.render("signin",{res})
})

router.post("/login", (req, res) => {
    passport.authenticate('local', function(err, user, info) {
        if (err) throw err
        if (!user) {
            res.locals.err = "Username or password is incorrect."
            res.status(401)
            return res.render("signin",{res})
        }
        req.logIn(user, function(err) {
            if (err) throw err
            return res.redirect("/snippets/feed");
        });
  })(req, res);
})

module.exports = router