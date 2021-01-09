const express = require('express')
let app = express()
const bodyParser = require("body-parser")
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const expressSession = require('express-session')
const path = require('path')

// Mongoose

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODBURI).then(_ => {
    console.log("DB Connected!")
}).catch(err => {
    throw err
})

// Models

let User = require('./models/user')

// Redis

const redis = require("redis")
const redisClient = redis.createClient({
    password: process.env.REDISPASS,
    url: process.env.REDISURI
})
redisClient.on("error", err => {
    throw err
})
const SessionStore = require("express-sessions")

// Express Session

app.use(expressSession({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false
    },
    store: new SessionStore({
        storage: 'redis',
        instance: redisClient
    })
}))

// Passport

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use(passport.initialize())
app.use(passport.session())

// Body Parser

app.use(bodyParser.urlencoded({extended: true}))

// Serve Static Files

app.use(express.static(path.join(__dirname,"public")))
app.use("/module",express.static(path.join(__dirname,"node_modules")))

// View Engine

app.set("view engine","ejs")

// Configure Routes

const auth =  require("./routes/auth")
const snippets = require("./routes/snippets")
const authenticate = require("./middleware/authenticate")
app.use("/auth",auth)
app.use("/snippets",authenticate,snippets)
app.get("/",(req, res) => {
    res.locals.isLoggedIn = req.user ? true : false
    res.locals.user = req.user
    res.render("index",{res})
})

// Export

module.exports = app