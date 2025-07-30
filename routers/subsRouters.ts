const { ensureAuthenticated } = require("../middleware/checkAuth");
import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/list", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subs = await db.subgroup.findMany();
  res.render("subs", { subs });
});

router.get("/show/:subname", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subName = req.params.subname;
  const posts = await db.post.findMany({
    take: 5,
    where: {
      sub: {
        name: subName
      }
    },
    include: {
      votes: true,
    }
  })

  const postsWithVoteCounts = posts.map(post => {
    const upvotes = post.votes.filter(v => v.value === 1).length;
    const downvotes = post.votes.filter(v => v.value === 0).length;
    return { ...post, upvotes, downvotes };
  });
  const user = req.user;
  res.render("sub", { posts: postsWithVoteCounts, user, subName });
});

export default router;
