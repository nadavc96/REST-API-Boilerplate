import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { getUserByEmail, createUser } from "../modules/auth/auth.repository";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (googleAccessToken, googleRefreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) return done(new Error("No email found in Google profile"));

        //Checks if user already exist
        let user = await getUserByEmail(email);

        //if user doesnt exist create user
        if (!user) {
          user = await createUser(email, ""); // no password for OAuth users
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
