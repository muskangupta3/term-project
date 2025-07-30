const { ensureAuthenticated } = require("../middleware/checkAuth");
import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/list",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subs = await db.subgroup.findMany();
  res.render("subs",{subs});
});

router.get("/show/:subname",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subName = req.params.subname;
  const posts = await db.post.findMany({
    take:5,
    where:{
    sub: {
      name: subName
    }
  }
  })
  const user = req.user;
  res.render("sub",{posts,user,subName});
});

export default router;
