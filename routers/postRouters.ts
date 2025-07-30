
import express, { Request, Response } from "express";
import * as database from "../controller/postController";
const router = express.Router();
import { ensureAuthenticated } from "../middleware/checkAuth";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/", async (req, res) => {
  const posts = await db.post.findMany({
    take : 10,
    include: { 
      votes: true, 
    }
  });
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
  const existingSubgroup = await db.subgroup.findUnique({ where: { name: data.subgroup } });
  if (!existingSubgroup) {
    await db.subgroup.create({ data: { name: data.subgroup } });
  }
  const createPost = await db.post.create({data});
  res.redirect('/posts')
});

router.get("/show/:postid",ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  await renderIndividualPostPage(req,res)
});

router.get("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(Number(req.params.postid));
  res.render("createPosts",{post});
});

router.post("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const editPost = await db.post.update({
    where: {
      id : Number(req.params.postid)
    },
    data: req.body
  })  
  await renderIndividualPostPage(req,res);
});

router.get("/deleteconfirm/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(Number(req.params.postid));
  res.render("deleteConfirm",{post,user});
});

router.post("/delete/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const deletePost = await db.post.delete({
    where:{
      id:Number(req.params.postid)
    }
  })
  res.redirect(`/subs/show/${deletePost.subgroup}`)
});

router.post("/comment-create/:postid", ensureAuthenticated, async (req, res) => {
    // ⭐ DONE TODO
    const user = await req.user;
    const commentContent = {
      post_id : Number(req.params.postid),
      description : req.body.description,
      creator:user?.id
    }
    await db.comment.create({data:commentContent});
    await renderIndividualPostPage(req,res)
  }
);

router.get("/comment-delete/:postid/:commentid", ensureAuthenticated, async (req, res) => {
  const deleteComment = await db.comment.delete({
    where:{
      id:Number(req.params.commentid)
    }
  })
  await renderIndividualPostPage(req,res)
});

router.post("/vote/:postid", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = Number(req.params.postid);
  const postContent = await decoratePost(postId);

  const existingVote = postContent?.votes.find(v => v.user_id === Number(user?.id));
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
        user_id:Number(user?.id),
        post_id:postId,
        value: newVote
      }
    })
  }
  else if(existingVote?.value != newVote){
    await db.votes.update({
      where :{
        votesId : existingVote?.votesId
      },
      data:{
        value:newVote
      }
    })
  }
  await renderIndividualPostPage(req,res);
});


async function decoratePost(postId:number){
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

async function renderIndividualPostPage(req:Request,res:Response){
  const post = await decoratePost(Number(req.params.postid));
  const user = await req.user;
  const vote = {
    upVotes: post?.votes.filter(v => v.value == 1).length,
    downVotes: post?.votes.filter(v => v.value == 0).length,
    userVote: post?.votes.find(v => v.user_id === Number(user?.id))?.value
  };
 
  res.render("individualPost", { post, user, vote });
}

export default router;
