const mongoose = require('mongoose')

const userInteractionSchema = mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    interactionType:{
        type:String,
        required:true,
        enum:["Like","Dislike", "Comment"]
    },
    timeLeftToExpire:{
        type:Number,
        required:true
    },
    commentText:{
        type:String,
    }
},
{
    _id: false,              // Disable automatic _id generation
    timestamps: true       // Adds createdAt and updatedAt fields
});
module.exports= userInteractionSchema