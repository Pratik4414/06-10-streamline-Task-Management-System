import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixAllUsersLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const users = [
      { email: 'john.manager@gmail.com', password: 'Manager123!@', name: 'John Manager' },
      { email: 'alice.dev@gmail.com', password: 'Alice123!@', name: 'Alice Developer' },
      { email: 'bob.design@outlook.com', password: 'Bob123!@#', name: 'Bob Designer' },
      { email: 'carol.test@yahoo.com', password: 'Carol123!@', name: 'Carol Tester' },
      { email: 'david.frontend@hotmail.com', password: 'David123!@', name: 'David Frontend' }
    ];
    
    console.log('🔧 Fixing passwords for all users...\n');
    
    for (const userData of users) {
      const user = await User.findOne({ email: userData.email });
      
      if (!user) {
        console.log(`❌ User not found: ${userData.email}`);
        continue;
      }
      
      // Hash the password
      const hashedPassword = await argon2.hash(userData.password);
      
      // Update using updateOne to bypass pre-save hook
      await User.updateOne(
        { email: userData.email },
        { password: hashedPassword }
      );
      
      // Verify the fix
      const updatedUser = await User.findOne({ email: userData.email });
      const isValid = await argon2.verify(updatedUser.password, userData.password);
      
      if (isValid) {
        console.log(`✅ ${userData.name} (${userData.email}) - Password fixed!`);
      } else {
        console.log(`❌ ${userData.name} (${userData.email}) - Password fix FAILED!`);
      }
    }
    
    console.log('\n🎉 All passwords have been fixed!');
    console.log('\n📋 Login Credentials:');
    console.log('━'.repeat(60));
    users.forEach(u => {
      console.log(`   ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Password: ${u.password}`);
      console.log('');
    });
    console.log('━'.repeat(60));
    console.log('\n✅ You can now login at http://localhost:5173\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllUsersLogin();
