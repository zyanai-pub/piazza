const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

app.use(bodyParser.json())

// Importing routes
const authRoute = require('./routes/auth')

app.use('/api/user',authRoute)

app.get('/',(req,res)=>{
    res.send('Hello World! Cloud@Birkbeck is fun!')    
})

mongoose.connect(process.env.DB_CONNECTOR).then(()=>{
    console.log('Your mongoDB connector is on...')
})

app.listen(3000, ()=>{
    console.log('Server is running')
})