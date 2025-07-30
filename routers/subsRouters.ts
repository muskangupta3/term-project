const { ensureAuthenticated } = require("../middleware/checkAuth");
import express from "express";
import * as database from "../controller/postController";
const router = express.Router();
import { getSubs,getPosts } from '../fake-db'
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/list",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  //const subs = await getSubs();
  const subs = await db.subgroup.findMany();
  res.render("subs",{subs});
});

router.get("/show/:subname",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subName = req.params.subname;
  //const posts = await getPosts(5,subName);
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
