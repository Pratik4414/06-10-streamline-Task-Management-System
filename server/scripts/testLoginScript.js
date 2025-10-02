import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';

async function testLogin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/project_mgmt');
    console.log('Connected to MongoDB');
    
    // Test the manager account
    const user = await User.findOne({ email: 'john.manager@gmail.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('Found user:', user.name);
    console.log('Stored password hash:', user.password);
    
    // Test password verification
    const isValid = await argon2.verify(user.password, 'Manager123!@');
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      console.log('Password mismatch. Updating password...');
      const hashedPassword = await argon2.hash('Manager123!@');
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      console.log('Password updated successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();