const { ensureAuthenticated } = require("../middleware/checkAuth");
import express from "express";
import * as database from "../controller/postController";
const router = express.Router();
import { getSubs,getPosts } from '../fake-db'

router.get("/list",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subs = await getSubs();
  res.render("subs",{subs});
});

router.get("/show/:subname",ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const subName = req.params.subname;
  const posts = await getPosts(5,subName);
  const user = req.user;
  res.render("sub",{posts,user,subName});
});

export default router;
