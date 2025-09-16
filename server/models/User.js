import mongoose from "mongoose";
import argon2 from "argon2"; // Using Argon2id for password hashing

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String,
    // Password is not required for users signing up via Google
    required: function() { return this.provider !== 'google'; }
  },
  role: { 
    type: String, 
    enum: ["employee", "manager"], 
    required: true 
  },
  provider: {
    type: String,
    default: 'local'
  }
});

// Hash password with Argon2 before saving (only if modified or new)
// Argon2id chosen over bcrypt for improved resistance to GPU cracking and side-channel attacks.
// The argon2 library automatically encodes parameters (memoryCost, timeCost, parallelism) into the hash string.
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password") || !this.password) {
      return next();
    }
    // Use secure defaults; you can tune memoryCost/timeCost via env if needed.
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id
      // Example for customization:
      // memoryCost: 2 ** 16, // 64 MB
      // timeCost: 3,
      // parallelism: 1
    });
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", UserSchema);
