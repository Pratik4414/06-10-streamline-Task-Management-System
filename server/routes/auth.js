import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2"; // Argon2id for password verification (memory-hard, GPU-resistant, modern PHC winner)
import passport from "passport";
// bcrypt is NOT installed anymore; we'll attempt a dynamic import only if we detect a legacy bcrypt hash.
let bcryptModule = null; // cached reference after first dynamic load

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

    let passwordMatches = false;

  // Hash format detection:
  //  - Argon2 hashes start with $argon2 and embed parameters + salt + hash (facilitates future tuning)
  //  - Legacy bcrypt hashes start with $2x/$2a/$2b/$2y and are less memory-hard
  // This allows seamless migration: verify old bcrypt once, then upgrade to Argon2 transparently.
    const storedHash = user.password;
    const isArgon2Hash = storedHash.startsWith('$argon2');
  const isBcryptHash = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$');

    try {
      if (isArgon2Hash) {
        passwordMatches = await argon2.verify(storedHash, password);
      } else if (isBcryptHash) {
        // Legacy bcrypt verification (backward compatibility path)
        if (!bcryptModule) {
          try {
            bcryptModule = await import('bcryptjs');
          } catch (e) {
            console.error('Legacy bcrypt hash detected but bcryptjs not available.');
            return res.status(500).json({ success: false, error: "Server hash verification configuration error" });
          }
        }
        const { default: bcrypt } = bcryptModule;
        passwordMatches = await bcrypt.compare(password, storedHash);
        // On success, transparently upgrade hash to Argon2id
        if (passwordMatches) {
          // On successful bcrypt verification, upgrade to Argon2id.
          // Rationale: Argon2 provides better defense against GPU/ASIC cracking by being memory-hard
          // and enables parameter evolution over time without changing code storing salts separately.
          try {
            const newHash = await argon2.hash(password, { type: argon2.argon2id });
            user.password = newHash;
            await user.save();
          } catch (rehashErr) {
            console.warn('Rehash (bcrypt -> argon2) failed:', rehashErr.message);
          }
        }
      } else {
        // Unknown hash format: force failure (could log anomaly)
        passwordMatches = false;
      }
    } catch (verifyErr) {
      console.error('Password verification error:', verifyErr.message);
      return res.status(500).json({ success: false, error: "Server error during password verification" });
    }

    if (!passwordMatches) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
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
