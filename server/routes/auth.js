import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2"; // Argon2id for password verification (memory-hard, GPU-resistant, modern PHC winner)
import passport from "passport";

const router = express.Router();

// --- Local Registration ---
router.post("/register", async (req, res) => {
  // Now expecting 'role' from the frontend
  const { name, email, password, role } = req.body; 

  // Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: "Please provide all required fields." });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Create a new user instance (password will be hashed by the pre-save hook)
    user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ success: true, message: "Registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ success: false, error: "Server error during registration" });
  }
});

// --- Local Login ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please provide email and password." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) { // Check if user exists and has a password (i.e., not a Google-only user)
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    try {
      const ok = await argon2.verify(user.password, password);
      if (!ok) {
        return res.status(400).json({ success: false, error: "Invalid credentials" });
      }
    } catch (verifyErr) {
      console.error('Password verification error (argon2):', verifyErr.message);
      return res.status(500).json({ success: false, error: "Server error during password verification" });
    }

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Using environment variable for secret
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        // Send back the token and user info (excluding password)
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ success: false, error: "Server error during login" });
  }
});

// --- Forgot Password ---
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, error: "Please provide an email address." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, we don't reveal if the email exists or not
      return res.json({ 
        success: true, 
        message: "If an account with this email exists, password reset instructions have been sent." 
      });
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with reset link
    // 
    // For now, we'll simulate the process
    console.log(`Password reset requested for: ${email}`);
    console.log(`User found: ${user.name} (${user.email})`);
    console.log('In a real app, an email would be sent with reset instructions.');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ 
      success: true, 
      message: "Password reset instructions have been sent to your email address." 
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).json({ success: false, error: "Server error. Please try again later." });
  }
});



// --- Google OAuth Routes ---
// This route starts the Google authentication process
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// This is the callback URL that Google will redirect to after user consent
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "http://localhost:5173/login", // Redirect to frontend login on failure
    session: false // We are using JWT, not sessions
  }),
  (req, res) => {
    // On successful authentication, req.user is available.
    // We sign a JWT for this user.
    const payload = {
        user: {
            id: req.user.id,
            role: req.user.role,
        }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Redirect back to the frontend with the token and user info
    const user = JSON.stringify({
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    });
    
    // A common practice is to pass the token as a query parameter or use a dedicated page to handle it
    res.redirect(`http://localhost:5173/dashboard?token=${token}&user=${encodeURIComponent(user)}`);
  }
);


export default router;
