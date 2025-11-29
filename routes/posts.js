const express = require('express')
const router = express.Router()

const User = require('../models/User')
const Post = require('../models/Post')
const userInteraction = require('../models/UserInteraction.js')
const verifyToken = require('../verifyToken')

//Action 3: Get all posts per topic
router.get('/', verifyToken, async(req,res) =>{
    try{
        const topic = req.query.topic;
        
        if (!topic) {
            return res.status(400).send({ message: "Topic query parameter is required." });
        }
        const posts = await Post.find({ topics: topic });

        if (posts.length === 0) {
            return res.status(404).send({ message: "No posts found for the specified topic." });
        }

        res.send(posts)
    }catch(err){
        res.status(400).send({message:err})
    }
});

// Action 2: Create a new post
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

// Action 4: Like/dislike/comment on a post
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

        if (!post) return res.status(404).send({ message: "Post not found" });

        // check if user deleted their account but still has a token
        if (!user) return res.status(404).send({ message: "User not found" });

        // check if post has expired
        if (post.status === "Expired") {
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

// Action 5: browse for the most active post per topic with the highest likes and dislikes
router.get('/mostActive', verifyToken,  async (req, res) => {
    try {
        const topic = req.query.topic;
        if (!topic) {
            return res.status(400).send({ message: "Topic query parameter is required." });
        }

        // Fetch posts for the specified topic
        const posts = await Post.find({ 
            topics: topic,
            expiration: { $gt: new Date() } // only live posts
        });
        
        // Determine the most active post based on likes + dislikes
        let mostActivePost = null;
        let highestActivityCount = -1;
        posts.forEach(post => {
            const activityCount = post.likes.length + post.dislikes.length;
            if (activityCount > highestActivityCount) {
                highestActivityCount = activityCount;
                mostActivePost = post;
            }
        });

        res.status(200).send(mostActivePost);

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Action 6: browse the history data of expired posts per topic.
router.get('/history', verifyToken,  async (req, res) => {
    try {
        const topic = req.query.topic;
        if (!topic) {
            return res.status(400).send({ message: "Topic query parameter is required." });
        }

        // Fetch expired posts for the specified topic
        const posts = await Post.find({ 
            topics: topic,
            expiration: { $lte: new Date() } // Only expired posts
        });

        res.status(200).send(posts);

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

module.exports = router