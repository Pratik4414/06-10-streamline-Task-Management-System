import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixAllPasswords = async () => {
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
      console.log(`✅ New hash created for ${user.name}`);
      
      // Update user using updateOne to ensure it's saved
      await User.updateOne({ email: userData.email }, { password: newHash });
      console.log(`✅ User updated in database`);
      
      // Verify the update worked
      const updatedUser = await User.findOne({ email: userData.email });
      const isValid = await argon2.verify(updatedUser.password, userData.password);
      console.log(`✅ Verification test: ${isValid ? 'PASS' : 'FAIL'}`);
      
      if (!isValid) {
        console.log(`❌ Failed to fix password for ${userData.email}`);
      }
    }
    
    console.log('\n🎉 Password fix completed!');
    console.log('\n🔐 Updated Test Credentials:');
    console.log('   Manager: john.manager@gmail.com / Manager123!@');
    console.log('   Employee: alice.dev@gmail.com / Alice123!@');
    console.log('   Employee: bob.design@outlook.com / Bob123!@#');
    console.log('   Employee: carol.test@yahoo.com / Carol123!@');
    console.log('   Employee: david.frontend@hotmail.com / David123!@');
    console.log('   Test User: test@gmail.com / Test123!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixAllPasswords();