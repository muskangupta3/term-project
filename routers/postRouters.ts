// @ts-nocheck
import express, { Request, Response } from "express";
import * as database from "../controller/postController";
const router = express.Router();
import { ensureAuthenticated } from "../middleware/checkAuth";
import { addPost,getPost,addComment,editPost,deletePost } from '../fake-db';
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/", async (req, res) => {
 // const posts = await database.getPosts(20);
  const posts = await db.post.findMany({take : 10});
  const user = await req.user;
  res.render("posts", { posts, user });
});

router.get("/create", ensureAuthenticated, (req, res) => {
  res.render("createPosts",{post:null});
});

router.post("/create", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const data = req.body;
  data.creator = req.user?.id;
  const createPost = await db.post.create({data});
  //await addPost(postContent.title,postContent.link,req.user.id,postContent.description,postContent.subgroup);
  res.redirect('/posts')
});

router.get("/show/:postid",ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const user = await req.user;
  //const post = await getPost(req.params.postid);
  // const post = await decoratePost(req.params.postid);
  // const vote = {
  //     upVotes: post?.votes.filter((v: { value: number; }) => v.value == 1).length,
  //     downVotes :post?.votes.filter(v => v.value == 0).length,
  //     userVote :post?.votes.find(v => v.user_id === user.id)?.value
  //   }
  // res.render("individualPost",{post,user,vote});
  await renderIndividualPostPage(req,res)
});

router.get("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(req.params.postid);
  res.render("createPosts",{post});
});

router.post("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  //await editPost(req.params.postid,editPostContent);
  const editPost = await db.post.update({
    where: {
      id : Number(req.params.postid)
    },
    data: req.body
  })  
  const user = await req.user;
  await renderIndividualPostPage(req,res);
  // const post = await decoratePost(req.params.postid);
  // res.render("individualPost",{post,user});
});

router.get("/deleteconfirm/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(req.params.postid);
  res.render("deleteConfirm",{post,user});
});

router.post("/delete/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const deletePost = await db.post.delete({
    where:{
      id:Number(req.params.postid)
    }
  })
  //await deletePost(req.params.postid);
  res.redirect(`/subs/show/${deletePost.subgroup}`)
});

router.post("/comment-create/:postid", ensureAuthenticated, async (req, res) => {
    // ⭐ DONE TODO
    const user = await req.user;
    // await addComment(commentContent.postId,user.id,commentContent.description);
    const commentContent = {
      post_id : Number(req.body.postId),
      description : req.body.description,
      creator:user.id
    }
    const comment = await db.comment.create({data:commentContent});
    // const post = await decoratePost(req.params.postid);
    // res.render("individualPost",{post,user});
    await renderIndividualPostPage(req,res)
  }
);

router.get("/comment-delete/:postid/:commentid", ensureAuthenticated, async (req, res) => {
  const deleteComment = await db.comment.delete({
    where:{
      id:Number(req.params.commentid)
    }
  })
  //const post = await decoratePost(deleteComment.post_id);
  const user = await req.user;
  //res.render("individualPost",{post,user});
  await renderIndividualPostPage(req,res)
});

router.post("/vote/:postid", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = Number(req.params.postid);
  const postContent = await decoratePost(postId);

  const existingVote = postContent.votes.find(v => v.user_id === user.id);
  const newVote = Number(req.body.voteType);

  if(existingVote?.value === newVote){
    await db.votes.delete({
      where :{
        votesId : existingVote?.votesId
      }
    })
  }
  else if(existingVote == undefined){
    await db.votes.create({
      data :{
        user_id:user?.id,
        post_id:postId,
        value: newVote
      }
    })
  }
  else if(existingVote != newVote){
    await db.votes.update({
      where :{
        votesId : existingVote?.votesId
      },
      data:{
        value:newVote
      }
    })
  }
  // const post = await decoratePost(postId);
  // const vote = {
  //   upVotes: post.votes.filter(v => v.value == 1).length,
  //   downVotes: post.votes.filter(v => v.value == 0).length,
  //   userVote: post.votes.find(v => v.user_id === user.id)?.value
  // };

  await renderIndividualPostPage(req,res);
 
  //res.render("individualPost", { post, user, vote });
});


async function decoratePost(postId){
  var post = await db.post.findFirst({
    where:{id:Number(postId)},
    include: { 
      user: true ,
      comments: {
        include: { user: true },
        },
      votes: true, 
    }
  })
  return post;
}

async function renderIndividualPostPage(req,res){
  const post = await decoratePost(Number(req.params.postid));
  const user = await req.user;
  const vote = {
    upVotes: post.votes.filter(v => v.value == 1).length,
    downVotes: post.votes.filter(v => v.value == 0).length,
    userVote: post.votes.find(v => v.user_id === user.id)?.value
  };
 
  res.render("individualPost", { post, user, vote });
}

export default router;
