import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

// Encrypt password before saving a new user with a password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", UserSchema);
