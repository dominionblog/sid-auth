const chai = require("chai")
const {expect} = chai
const chaiAsHttp = require("chai-http")
const dotenv = require('dotenv')
dotenv.config()
chai.use(chaiAsHttp)
const jsdom = require("jsdom")
const {JSDOM} = jsdom

const app = require("../app.js")
const agent = chai.request.agent(app).keepOpen()

const mongoose = require("mongoose")

const User = require("../models/user")

let credentials = {
    username: 'user',
    password: 'password'
}

describe("Logging in", () => {
    before("Connects to the database", done => {
        mongoose.connect(process.env.MONGODBURI).then(_ => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("Empties the database", () => {
        mongoose.connection.dropCollection("users").then(_ => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                // Collection does not exist
                done()
            } else {
                done(err)
            }
        })
    })
    it("Tries to access a protected route without credentials", done => {
        agent.get("/snippets/feed")
        .type('form')
        .send(credentials)
        .then(res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            expect(res).to.have.status(401)
            expect(page.querySelector(".err-message h2").innerHTML).to.include("An Error Occured")
            expect(page.querySelector(".err-message p").innerHTML).to.include("Your session has ended. Please log in again to continue.")
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Creates an account", done => {
        agent.post("/auth/register")
        .type('form')
        .send(credentials)
        .then(async res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            expect(res).to.have.status(200)
            let user = await User.findOne({username: credentials.username})
            expect(user).to.be.an('object')
            expect(page.querySelector(".success-message h2").innerHTML).to.include("Success!")
            expect(page.querySelector(".success-message p").innerHTML).to.include("Thank you for creating an account! Please log in using your new credentials!")
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Tries to create an account with a duplicate username", done => {
        agent.post('/auth/register')
        .type('form')
        .send(credentials)
        .then(async res => {
            expect(res).to.have.status(400)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Tries to make an account with various bad combinations", done => {
        let usernames = ["thisislongerthantwentycharactersiamsendingthelibraryofcongress", "    ", "    bad","user    ",""]
        let passwords = ["    ",""]
        let requests = []
        for (let i = 0; i < usernames.length; i++) {
            for (let v = 0; v < passwords.length; v++) {
                requests.push(agent.post('/auth/register')
                .type('form')
                .send({
                    username: usernames[i],
                    password: passwords[v]
                }))
            }
        }
       Promise.all(requests).then(res => {
           res.forEach((x, i) => {
               expect(x, "Failed at combination #" + i).to.have.status(400)
               let dom = new JSDOM(x.text)
               expect(dom.window.document.querySelector(".err-message").innerHTML).to.include("An Error Occured")
           })
           done()
       }).catch(err => {
           done(err)
       })
    })
    it("Tries to log in withn an invalid password", done => {
        agent.post("/auth/login")
        .type("form")
        .send({
            username: "user",
            password: 'not the right password'
        })
        .then(res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            expect(res).to.have.status(401)
            expect(page.querySelector(".err-message").innerHTML)
            .to.include("An Error Occured")
            .and.to.include("Username or password is incorrect.")
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Logs the user in", done => {
        agent.post("/auth/login")
        .type("form")
        .send(credentials)
        .then(res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            expect(res).to.have.status(200)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Tries to access a protected route", done => {
        agent.get("/snippets/feed").then(res => {
            expect(res).to.have.status(200)
            done()
        }).catch(err => {
            done(err)
        })
    })
})