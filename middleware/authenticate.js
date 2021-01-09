module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user
        res.locals.isLoggedIn = true
        return next()
    }   
    res.status(401)
    res.locals.err = "Your session has ended. Please log in again to continue." 
    res.render("signin",{res})
    res.end()
}