const { ensureAuthenticated } = require("../middleware/checkAuth");
import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
import { renderPosts } from '../routers/postRouters'

const db = new PrismaClient();

router.get("/list", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subs = await db.subgroup.findMany();
  res.render("subs", { subs });
});

router.get("/show/:subname", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  // const user = req.user;
  const subName = req.params.subname;
  await renderPosts(req, res, 5, subName)
  // const posts = await db.post.findMany({
  //   take: 5,
  //   where: {
  //     sub: {
  //       name: subName
  //     }
  //   },
  //   include: {
  //     votes: true,
  //   }
  // })

  // const postsWithVoteCounts = posts.map(post => {
  //   const upvotes = post.votes.filter(v => v.value === 1).length;
  //   const downvotes = post.votes.filter(v => v.value === 0).length;
  //   const userVote = post?.votes.find(v => v.user_id === Number(user?.id))?.value
  //   return { ...post, upvotes, downvotes, userVote };
  // });
  // res.render("sub", { posts: postsWithVoteCounts, user, subName });
});

export default router;
