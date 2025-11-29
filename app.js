const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

app.use(bodyParser.json())

// Importing routes
const authRoute = require('./routes/auth')
const postsRoute = require('./routes/posts')

app.use('/api/user',authRoute)

app.use('/api/posts',postsRoute)

app.get('/',(req,res)=>{
    res.send('Welcome to Piazza API, please register or login to continue.')    
})

mongoose.connect(process.env.DB_CONNECTOR).then(()=>{
    console.log('Your mongoDB connector is on...')
})

app.listen(3000, ()=>{
    console.log('Server is running')
})