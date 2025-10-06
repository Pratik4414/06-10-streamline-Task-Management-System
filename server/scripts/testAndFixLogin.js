import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testAndFixLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testEmail = 'john.manager@gmail.com';
    const testPassword = 'Manager123!@';
    
    // Find the user
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('📋 User found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔐 Password hash (first 50 chars):', user.password.substring(0, 50));
    
    // Try to verify the password
    console.log('\n🧪 Testing password verification...');
    try {
      const isValid = await argon2.verify(user.password, testPassword);
      console.log('✅ Password verification result:', isValid);
      
      if (!isValid) {
        console.log('\n❌ Password does NOT match!');
        console.log('🔧 Fixing password by setting it directly...\n');
        
        // Update the password directly using User.updateOne to bypass the pre-save hook
        const hashedPassword = await argon2.hash(testPassword);
        await User.updateOne(
          { email: testEmail },
          { password: hashedPassword }
        );
        
        // Verify the fix
        const updatedUser = await User.findOne({ email: testEmail });
        const isValidNow = await argon2.verify(updatedUser.password, testPassword);
        console.log('✅ Password fixed! Verification now:', isValidNow);
        
        if (isValidNow) {
          console.log('\n🎉 SUCCESS! You can now login with:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
        }
      } else {
        console.log('\n✅ Password is already correct! You should be able to login.');
      }
    } catch (verifyError) {
      console.log('❌ Password verification error:', verifyError.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAndFixLogin();
