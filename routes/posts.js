const express = require('express')
const router = express.Router()

const User = require('../models/User')
const Post = require('../models/Post')
const userInteraction = require('../models/UserInteraction.js')
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

// Like/dislike/comment on a post
router.patch('/:postId', verifyToken, async (req, res) => {
        if (!('Comment'===req.body.interactionType) && req.body.commentText) {
            return res.status(400).send({ message: "Comment text should only be provided for 'Comment' interaction type." });
        }

        if ('Comment'===req.body.interactionType && !req.body.commentText) {
            return res.status(400).send({ message: "Comment text is required" });
        }

        //fetch post by id and user details from token
        const post = await Post.findById(req.params.postId);
        const user = await User.findById(req.user._id);

        if (!Post) return res.status(404).send({ message: "Post not found" });

        // check if user deleted their account but still has a token
        if (!user) return res.status(404).send({ message: "User not found" });

        // check if post has expired
        if (Post.status === "Expired" || post.expiration < Date.now()) {
            return res.status(403).send({ message: "Cannot interact with an expired post." });
        }

        // check if user is the post owner
        if (post.owner === user.username && (req.body.interactionType !== "Comment")) {
            return res.status(403).send({ message: "Post owners cannot like or dislike their own posts." });
        }

        const newUserInteraction = {
        username: user.username,
        interactionType: req.body.interactionType,
        timeLeftToExpire: post.expiration - Date.now(),
        commentText: req.body.commentText,
    }

    try{
        const updatePostById = await Post.updateOne(
            {_id: req.params.postId},
            {
                // using push based on MongoDB documentation: https://www.mongodb.com/docs/manual/reference/operator/update/push/
                $push: {
                    [req.body.interactionType.toLowerCase() + 's']: newUserInteraction
                }
                
            }
        )
        if (updatePostById.matchedCount === 0) {
            return res.status(404).send({ message: "Post not found" });
        }

        // return success message
        res.status(200).send({ message: "Interaction added successfully." });

    }catch(err){
        res.send({message: err});
    }
})

module.exports = router