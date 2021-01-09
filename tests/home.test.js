const chai = require("chai")
const chaiHttp = require("chai-http")
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiHttp)
chai.use(chaiAsPromised)
const {expect} = chai
const app = require("../app")
let agent = chai.request.agent(app).keepOpen()
const jsdom = require('jsdom')
const {JSDOM} = jsdom
const mongoose = require('mongoose')
const User = require("../models/user")

describe("Test the home page", () => {
    before("Connect to the DB", done => {
        mongoose.connect(process.env.MONGODBURI).then(_ => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("Clear the DB", done => {
        mongoose.connection.dropCollection("users").then(_ => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                done()
            } else {
                done(err)
            }
        })
    })
    let credentials = {
        username: 'user',
        password: 'user'
    }
    let user
    before("Create an account", done => {
        User.register({
            username: credentials.username
        },credentials.password).then(doc => {
            user = doc
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Opens without being logged in", done => {
        agent.get("/")
        .then(res => {
            let dom = new JSDOM(res.text)
            expect(dom.window.document.querySelector(".account-info").innerHTML).to.include("Not Logged In")
            expect(dom.window.document.querySelector(".navigation-button")).to.be.null
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Opens while being logged in", done => {
        agent.post("/auth/login").type('form').send(credentials).then(_ => {
            agent.get("/")
            .then(res => {
                let dom = new JSDOM(res.text)
                let page = dom.window.document
                expect(page.querySelector(".username-display").innerHTML).to.be.equal(user.get('username'))
                expect(page.querySelector(".new-btn").innerHTML).to.be.a("string")
                expect(page.querySelector(".feed-btn").innerHTML).to.be.a("string")
                done()
            }).catch(err => {
                done(err)
            })
        }).catch(err => {
            done(err)
        })
    })
})