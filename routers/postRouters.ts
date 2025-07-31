import express, { Request, Response } from "express";
const router = express.Router();
import { ensureAuthenticated } from "../middleware/checkAuth";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

router.get("/", async (req, res) => {
  await renderPosts(req, res, 10);
  // const user = await req.user;
  // const posts = await db.post.findMany({
  //   take: 10,
  //   include: {
  //     votes: true,
  //   }
  // });

  // const postsWithVoteCounts = posts.map(post => {
  //   const upvotes = post.votes.filter(v => v.value === 1).length;
  //   const downvotes = post.votes.filter(v => v.value === 0).length;
  //   const userVote = post?.votes.find(v => v.user_id === Number(user?.id))?.value
  //   return { ...post, upvotes, downvotes, userVote };
  // });
  // res.render("posts", { posts: postsWithVoteCounts, user });
});

router.get("/create", ensureAuthenticated, (req, res) => {
  res.render("createPosts", { post: null });
});

router.post("/create", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const data = req.body;
  data.creator = req.user?.id;
  const existingSubgroup = await db.subgroup.findUnique({ where: { name: data.subgroup } });
  if (!existingSubgroup) {
    await db.subgroup.create({ data: { name: data.subgroup } });
  }
  const createPost = await db.post.create({ data });
  res.redirect('/posts')
});

router.get("/show/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  await renderIndividualPostPage(req, res)
});

router.get("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(Number(req.params.postid));
  res.render("createPosts", { post });
});

router.post("/edit/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const editPost = await db.post.update({
    where: {
      id: Number(req.params.postid)
    },
    data: req.body
  })
  await renderIndividualPostPage(req, res);
});

router.get("/deleteconfirm/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐DONE TODO
  const user = await req.user;
  const post = await decoratePost(Number(req.params.postid));
  res.render("deleteConfirm", { post, user });
});

router.post("/delete/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const postId = Number(req.params.postid);

  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) return res.status(404).send("Post not found");

  const subgroupName = post.subgroup;

  await db.votes.deleteMany({
    where: { post_id: postId },
  });

  await db.comment.deleteMany({
    where: { post_id: postId },
  });

  await db.post.delete({
    where: { id: postId },
  });

  // const remainingPosts = await db.post.count({
  //   where: { subgroup: subgroupName },
  // });

  // if (remainingPosts === 0) {
  //   await db.subgroup.delete({
  //     where: { name: subgroupName },
  //   });
  // }

  res.redirect(`/subs/show/${subgroupName}`);
});

router.post("/comment-create/:postid", ensureAuthenticated, async (req, res) => {
  // ⭐ DONE TODO
  const user = await req.user;
  const commentContent = {
    post_id: Number(req.params.postid),
    description: req.body.description,
    creator: Number(user?.id)
  }
  await db.comment.create({ data: commentContent });
  await renderIndividualPostPage(req, res)
}
);

router.get("/comment-delete/:postid/:commentid", ensureAuthenticated, async (req, res) => {
  await db.comment.delete({
    where: {
      id: Number(req.params.commentid)
    }
  })
  await renderIndividualPostPage(req, res)
});

router.post("/vote/:postid", ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = Number(req.params.postid);
  const postContent = await decoratePost(postId);

  const existingVote = postContent?.votes.find(v => v.user_id === Number(user?.id));
  const newVote = Number(req.body.setvoteto);

  if (existingVote?.value === newVote) {
    await db.votes.delete({
      where: {
        votesId: existingVote?.votesId
      }
    })
  }
  else if (existingVote == undefined) {
    await db.votes.create({
      data: {
        user_id: Number(user?.id),
        post_id: postId,
        value: newVote
      }
    })
  }
  else if (existingVote?.value != newVote) {
    await db.votes.update({
      where: {
        votesId: existingVote?.votesId
      },
      data: {
        value: newVote
      }
    })
  }

  if (req.query.from === 'individualPost') {
    await renderIndividualPostPage(req, res);
  }
  else if (req.query.from === 'posts') {
    await renderPosts(req, res, 10);
  }
  else {
    const queryParam = req.query.from?.toString();
    await renderPosts(req, res, 5, queryParam)
  }
});

async function decoratePost(postId: number) {
  var post = await db.post.findFirst({
    where: { id: Number(postId) },
    include: {
      user: true,
      comments: {
        include: { user: true },
      },
      votes: true,
    }
  })
  return post;
}

async function renderIndividualPostPage(req: Request, res: Response) {
  const user = await req.user;
  const post = await decoratePost(Number(req.params.postid));
  const vote = {
    upVotes: post?.votes.filter(v => v.value == 1).length,
    downVotes: post?.votes.filter(v => v.value == 0).length,
    userVote: post?.votes.find(v => v.user_id === Number(user?.id))?.value
  };
  res.render("individualPost", { post, user, vote });
}

async function renderPosts(req: Request, res: Response, n: number, subName?: string) {
  const user = await req.user;
  const posts = await db.post.findMany({
    take: n,
    include: {
      votes: true,
    },
    where: {
      sub: {
        name: subName
      }
    }
  });

  const postsWithVoteCounts = posts.map(post => {
    const upvotes = post.votes.filter(v => v.value === 1).length;
    const downvotes = post.votes.filter(v => v.value === 0).length;
    const userVote = post?.votes.find(v => v.user_id === Number(user?.id))?.value
    return { ...post, upvotes, downvotes, userVote };
  });

  if (subName) {
    res.render("sub", { posts: postsWithVoteCounts, user, subName });
  }
  else {
    res.render("posts", { posts: postsWithVoteCounts, user });
  }
}

export default router;
export { renderPosts };
