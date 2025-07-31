import express from "express";
import passport from "../middleware/passport-db";
// import passport from "../middleware/passport";
const router = express.Router();
const devMode = process.env.MODE === "dev"

router.get("/login", async (req, res) => {
  const messages = req.session.messages || [];
  req.session.messages = [];
  res.render("login", { devMode, messages });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/posts",
    failureRedirect: "/auth/login",
    failureMessage:true
  })
);

router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/");
});

export default router;
