//Code taken from Lab 4.1 available at https://github.com/warestack/cc/blob/main/Class-4/Lab4.1-Building-the-MiniFilm-application.md

const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:true,
        min:3,
        max:256
    },
    email:{
        type:String,
        required:true,
        min:6,
        max:256
    },
    password:{
        type:String,
        required:true,
        min:6,
        max:1024
    },
    date:{
        type:Date,
        default:Date.now
    }
})
module.exports=mongoose.model('users',userSchema)