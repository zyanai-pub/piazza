//based on the schemas in lab 3.2 available at https://github.com/warestack/cc/blob/main/Class-3/part2.md

const mongoose = require('mongoose')

const userInteractionSchema = require('./UserInteraction.js');

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    topics: {
        type: [String], 
        required: true,
        enum: ["Politics", "Health", "Sport", "Tech"], //Enumeration for post topics (https://www.geeksforgeeks.org/mongodb/how-to-create-and-use-enum-in-mongoose/
        validate: { // Custom validator to ensure at least one topic is provided (based on https://mongoosejs.com/docs/validation.html)
            validator: function(v) {
                return v && v.length > 0; 
            },
            message: 'A post must have at least one topic.'
        }
    },
    message:{
        type:String,
        required:true,
    },
    expiration:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:["Live","Expired"],
        default:"Live"
    },
    owner:{
        type:String,
        required:true
    },
    likes: {
        type: [userInteractionSchema], 
        default: []
    },
    dislikes: {
        type: [userInteractionSchema],
        default: []
    },
    comments:{
        type: [userInteractionSchema],
        default:[]
    }
},
{
    collection: 'Posts',   // Explicit collection name in MongoDB
    timestamps: true       // Adds createdAt and updatedAt fields
});
module.exports=mongoose.model('Posts',postSchema)