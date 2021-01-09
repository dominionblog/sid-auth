const dotenv = require('dotenv')

if (process.env.NODE_ENV != 'production') {
    dotenv.config()
}

const app = require("./app")

app.listen(process.env.PORT, () => {
    console.log("Server is listening to port ", process.env.PORT)
})