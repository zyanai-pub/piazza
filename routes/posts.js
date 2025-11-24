const express = require('express')
const router = express.Router()

const User = require('../models/User')
const Post = require('../models/Post')
const verifyToken = require('../verifyToken')

// Get all posts per topic
router.get('/', verifyToken, async(req,res) =>{
    try{
        const posts = await Post.find({ topics: req.query.topic });
        res.send(posts)
    }catch(err){
        res.status(400).send({message:err})
    }
});

// Create a new post
router.post('/', verifyToken, async(req,res) =>{

    // fetch user details from token. based on https://www.geeksforgeeks.org/mongodb/mongoose-findbyid-function/
    const user = await User.findById(req.user._id);
    
    // check if user deleted their account but still has a token
    if (!user) return res.status(404).send({ message: "User not found" });

    if (!req.body.expiration || req.body.expiration <= 0) {
        return res.status(400).send({ message: "Valid Expiration time (in minutes) is required." });
    }
    const post = new Post({
        title: req.body.title,
        topics: req.body.topics,
        message: req.body.message,
        expiration: new Date(Date.now() + req.body.expiration * 60000), // Set expiration time based on current time plus minutes
        owner: user.username
    })
    try{
        const savedPost = await post.save()
        res.send(savedPost)
    }catch(err){
        res.status(400).send({message:err})
    }
})

module.exports = router