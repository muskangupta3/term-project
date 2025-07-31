import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const localLogin = new LocalStrategy(
    {
        usernameField: "uname",
        passwordField: "password",
    },
    async (uname: string, password: string, done: any) => {
        try {
            const user = await db.user.findFirst({
                where: {
                    uname: uname,
                    password: password,
                },
            });

            if (user && user.password === password) {
                return done(null, user);
            } else {
                return done(null, false, {
                    message: "Your login details are not valid. Please try again.",
                });
            }
        } 
        catch (err: unknown) {
            if (err instanceof Error) {
                done(null, false, { message: err.message })
            } else {
                console.error("An unknown error occurred:", err);
            }
        }
    }
);

passport.serializeUser(function (user: Express.User, done: (err: any, id?: number) => void) {
    done(null, user.id);
});

passport.deserializeUser(async function (id: number, done: (err: any, user?: Express.User | false | null) => void) {
    const user = await db.user.findFirst({ where: { id } });
    if (user) {
        done(null, user);
    } else {
        done({ message: "User not found" }, null);
    }
});


export default passport.use(localLogin);
