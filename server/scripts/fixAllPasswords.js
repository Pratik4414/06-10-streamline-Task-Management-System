import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';

async function fixAllPasswords() {
  try {
    await mongoose.connect('mongodb://localhost:27017/project_mgmt');
    console.log('Connected to MongoDB');
    
    const users = [
      { email: 'john.manager@gmail.com', password: 'Manager123!@' },
      { email: 'alice.dev@gmail.com', password: 'Alice123!@' },
      { email: 'bob.design@outlook.com', password: 'Bob123!@#' },
      { email: 'carol.test@yahoo.com', password: 'Carol123!@' },
      { email: 'david.frontend@hotmail.com', password: 'David123!@' }
    ];
    
    for (const userData of users) {
      const user = await User.findOne({ email: userData.email });
      if (user) {
        const hashedPassword = await argon2.hash(userData.password);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log(`Updated password for ${user.name} (${userData.email})`);
      }
    }
    
    console.log('All passwords updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllPasswords();