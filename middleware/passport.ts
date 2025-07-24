import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  getUserByEmailIdAndPassword,
  getUserById,
} from "../controller/userController";

// ⭐ DONE TODO: Passport Types
const localLogin = new LocalStrategy(
  {
    usernameField: "uname",
    passwordField: "password",
  },
  async (uname: string, password: string,done:any) => {
    // Check if user exists in database
    const user = await getUserByEmailIdAndPassword(uname, password);
    // console.log('passport 13: '+ user.uname);
    return user
      ? done(null, user)
      : done(null, false, {
          message: "Your login details are not valid. Please try again.",
        });
  }
);

// ⭐ DONE TODO: Passport Types
passport.serializeUser(function (user: Express.User, done: (err: any, id?: string) => void)  {
  console.log("serialize: " + user.id);
  done(null, user.id);
});

// ⭐ DONE TODO: Passport Types
passport.deserializeUser(async function (id: string, done: (err: any, user?: Express.User | false | null) => void) {
  const user = await getUserById(id);
  if (user) {
    done(null, user);
  } else {
    done({ message: "User not found" }, null);
  }
});

export default passport.use(localLogin);
