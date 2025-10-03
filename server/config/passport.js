import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

// We wrap the logic in a function that we can export and call later
export default function(passport) {
  // Only configure Google OAuth if credentials are properly set
  if (process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_CLIENT_ID !== 'placeholder_google_client_id' &&
      process.env.GOOGLE_CLIENT_SECRET !== 'placeholder_google_client_secret') {
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback", // Relative URL is fine
        },
        async (accessToken, refreshToken, profile, done) => {
          const newUser = {
            name: profile.displayName,
            email: profile.emails[0].value,
            role: 'employee', // Default role for new Google sign-ups
            provider: 'google', // Set the provider
          };

          try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // User exists, pass them along
              return done(null, user);
            } else {
              // User doesn't exist, create them
              user = await User.create(newUser);
              return done(null, user);
            }
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  } else {
    console.log('Google OAuth not configured - skipping Google strategy setup');
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch(err) {
        done(err, null);
    }
  });
}
