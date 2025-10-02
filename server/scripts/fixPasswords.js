import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = [
      { email: 'john.manager@gmail.com', password: 'Manager123!@' },
      { email: 'alice.dev@gmail.com', password: 'Alice123!@' },
      { email: 'bob.design@outlook.com', password: 'Bob123!@#' },
      { email: 'carol.test@yahoo.com', password: 'Carol123!@' },
      { email: 'david.frontend@hotmail.com', password: 'David123!@' }
    ];
    
    for (const userData of users) {
      console.log(`\n🔧 Fixing password for: ${userData.email}`);
      
      const user = await User.findOne({ email: userData.email });
      if (!user) {
        console.log(`❌ User not found: ${userData.email}`);
        continue;
      }
      
      // Create new hash
      const newHash = await argon2.hash(userData.password);
      console.log(`New hash created for ${user.name}`);
      
      // Update user
      user.password = newHash;
      await user.save();
      
      // Test the new hash
      const isValid = await argon2.verify(newHash, userData.password);
      console.log(`✅ Verification test: ${isValid ? 'PASS' : 'FAIL'}`);
    }
    
    console.log('\n🎉 All passwords fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixPasswords();