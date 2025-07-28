// @ts-nocheck
import express from "express";
import * as database from "../controller/postController";
const router = express.Router();
import { ensureAuthenticated } from "../middleware/checkAuth";
import { addPost,getPost,addComment,editPost,deletePost } from '../fake-db'

router.get("/", async (req, res) => {
  const posts = await database.getPosts(20);
  const user = await req.user;
  res.render("posts", { posts, user });
});

router.get("/create", ensureAuthenticated, (req, res) => {
  res.render("createPosts",{post:null});
});

router.post("/create", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const postContent = req.body;
  await addPost(postContent.title,postContent.link,req.user.id,postContent.description,postContent.subgroup);
  res.redirect('/posts')
});

router.get("/show/:postid",ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const user = await req.user;
  const post = await getPost(req.params.postid);
  const vote = {
      upVotes: post.votes.filter(v => v.value == 1).length,
      downVotes :post.votes.filter(v => v.value < 0).length,
      userVote :post.votes.find(v => v.user_id === user.id)?.value || 0
    }
  res.render("individualPost",{post,user,vote});
});

router.get("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await getPost(req.params.postid);
  res.render("createPosts",{post});
});

router.post("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const editPostContent = req.body;
  await editPost(req.params.postid,editPostContent);

  const user = await req.user;
  const post = await getPost(req.params.postid);
  res.render("individualPost",{post,user});
});

router.get("/deleteconfirm/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await getPost(req.params.postid);
  res.render("deleteConfirm",{post,user});
});

router.post("/delete/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const post = await getPost(req.params.postid);
  await deletePost(req.params.postid);
  res.redirect('/subs/show/subgroup')
});

router.post("/comment-create/:postid", ensureAuthenticated, async (req, res) => {
    // ⭐ DONE TODO
    const commentContent = req.body;
    const user = await req.user;
    await addComment(commentContent.postId,user.id,commentContent.description);
    const post = await getPost(commentContent.postId);
    res.render("individualPost",{post,user});
  }
);

export default router;
