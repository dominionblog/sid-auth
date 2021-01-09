const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const {expect} = chai
const app = require("../app")
const dotenv = require("dotenv")
dotenv.config()
const jsdom = require('jsdom')
const {JSDOM} = jsdom
const moment = require("moment")
const ms = require('ms')
const tk = require("timekeeper")

const agent = chai.request.agent(app).keepOpen()

const mongoose = require('mongoose')
const Snippet = require("../models/snippets")
const { request } = require('../app')

describe("Creating and Managing Snippets", () => {
    let credentials = {
        username: 'user',
        password: 'password'
    }
    before("Connects to the db", done => {
        mongoose.connect(process.env.MONGODBURI).then(() => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("Drops the snippets db", done => {
        mongoose.connection.dropCollection('snippets').then(() => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                done()
            } else {
                done(err)
            }
        })
    })
    before("Drops the users db", done => {
        mongoose.connection.dropCollection('users').then(() => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                done()
            } else {
                done(err)
            }
        })
    })
    before("creates an account and logs the user in", done => {
        agent.post("/auth/register").type('form').send(credentials).then(res => {
            expect(res).to.have.status(200)
            agent.post("/auth/login").type('form').send(credentials).then(res => {
                expect(res).to.have.status(200)
                done()
            }).catch(err => {
                done(err)
            })
        }).catch(err => {
            done(err)
        })
    })
    it("Loads the empty feed", done => {
        agent.get("/snippets/feed").then(res => {
            expect(res).to.have.status(200)
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            // Database has been emptied so there should be no snippets to show
            expect(page.querySelector(".no-results").innerHTML).to.include("No Results")
            // Button should be active
            expect(page.querySelector('.feed-btn').classList.contains('active')).to.be.true
            expect(page.querySelector('.new-btn').classList.contains('active')).to.be.false
            done()
        }).catch(err => {
            done(err)
        })
    })
    let snippet = {
        content: "Hello world!"
    }
    it("Opens the new snippet page", done => {
        agent.get("/snippets/new").then(res => {
            expect(res).to.have.status(200)
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            let form = page.querySelector('form')
            expect(form.getAttribute('action')).to.be.equal('/snippets/new')
            expect(form.getAttribute('method')).to.be.equal('POST')
            expect(page.querySelector('.success-message')).to.be.null
            expect(typeof page.querySelector('form textarea')).to.be.equal('object') // for some reason to.be.an('object') does not work here
            expect(page.querySelector('.new-btn').classList.contains('active')).to.be.true
            expect(page.querySelector('.feed-btn').classList.contains('active')).to.be.false
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Creates a new snippet", done => {
        agent.post("/snippets/new").type('form').send(snippet).then(res => {
            expect(res).to.have.status(200)
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            // Snippet should be created
            expect(page.querySelector(".success-message").innerHTML).to.include("Snippet created")
            // Let's check in the db
            Snippet.findOne({content: snippet.content}).then(res => {
                expect(res).to.be.an('object')
                done()
            }).catch(err => {
                done(err)
            })
        }).catch(err => {
            done(err)
        })
    })
    it("Opens the feed to view the snippet", done => {
        agent.get("/snippets/feed").then(res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            // There should be only one snippet
            let snippets = page.querySelectorAll(".card.snippet")
            expect(snippets).to.have.length(1)
            expect(snippets[0].querySelector(".card-text").innerHTML).to.include(snippet.content)
            let today = moment().format("MMMM Do yyyy") // We are assuming the snippet was created today, which it was.
            expect(snippets[0].querySelector(".card-subtitle").innerHTML).to.include(today)
            done()
        }).catch(err => {
            done(err)
        })
    })
    let newSnippet = {
        content: 'Content posted a day later'
    }
    /**
     * Goes through a list of children and determines whether they are in the correct order. Returns false if they are not and true if they are. The correct order is that the first element should be the most recent one, and the last element should be the least recent one.
     * @param {Array} children - Array of HTML elements that the computer should cycle through
     */
    let checkOrder = children => {
        let mostRecent = null
        for (let i = 0; i < children.length; i++) {
            // The first element is the most recent
            let date = moment(children[i].querySelector(".card-subtitle .date").innerHTML, "MMMM Do YYYY").unix()
            if (!mostRecent) {
                mostRecent = date
            } else if (mostRecent < date) {
                // This should not be the case
                return false
            } else {
                mostRecent = date
            }
        }
        return true
    }
    it("Creates several snippets at different dates", async () => {
        for (let i = 1; i < 5; i++) {
            let tomorrow = (moment().unix() * 1000) + ms(i + ' day')
            let tomorrowDate = new Date(tomorrow)
            tk.travel(tomorrowDate)
            await agent.post("/snippets/new").type('form').send({
                content: "Test Number " + i
            })
        }
    })
    it("Tests the order of the snippets", done => {
        agent.get("/snippets/feed").then(res => {
            let dom = new JSDOM(res.text)
            let page = dom.window.document
            let childrenNodes = page.querySelector('.feed-cards').children
            let children = Array.from(childrenNodes) // The order is the same as that of the source code
            expect(checkOrder(children)).to.be.true
            done()
        }).catch(err => {
            done(err)
        })
    })
})