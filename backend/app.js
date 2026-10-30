const express = require('express')
const cors = require('cors');
const db = require('./db/db')
const app = express()

require('dotenv').config()

const PORT = process.env.PORT

// middleware
app.use(express.json())
app.use(cors())

// routes
app.use('/api/v1', require('./routes/auth'))
app.use('/api/v1', require('./routes/transactions'))

const server = async () => {
    await db.db()
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

server().catch((error) => {
    console.error("Server startup failed:", error.message)
    process.exitCode = 1
})