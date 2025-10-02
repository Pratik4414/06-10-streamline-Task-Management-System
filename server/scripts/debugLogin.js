import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'test@gmail.com';
    const password = 'Test123!';
    
    console.log('\n🔍 Step-by-step login debug:');
    
    // Step 1: Find user
    console.log('1. Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log(`✅ User found: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Has password: ${!!user.password}`);
    console.log(`   Password hash length: ${user.password?.length}`);
    
    // Step 2: Get the stored hash
    console.log('\n2. Checking stored password hash...');
    console.log(`   Hash starts with: ${user.password.substring(0, 20)}...`);
    
    // Step 3: Test password verification
    console.log('\n3. Testing password verification...');
    console.log(`   Testing password: "${password}"`);
    
    try {
      const isValid = await argon2.verify(user.password, password);
      console.log(`   Verification result: ${isValid}`);
      
      if (!isValid) {
        // Try creating a new hash and comparing
        console.log('\n4. Creating fresh hash for comparison...');
        const newHash = await argon2.hash(password);
        const newTest = await argon2.verify(newHash, password);
        console.log(`   Fresh hash verification: ${newTest}`);
        
        // Compare hash parameters
        console.log(`\n5. Hash analysis:`);
        console.log(`   Stored hash: ${user.password.substring(0, 50)}...`);
        console.log(`   Fresh hash:  ${newHash.substring(0, 50)}...`);
        
        // Update user with new hash
        console.log('\n6. Updating user with fresh hash...');
        await User.updateOne({ email }, { password: newHash });
        console.log('   User updated');
        
        // Test again
        const updatedUser = await User.findOne({ email });
        const finalTest = await argon2.verify(updatedUser.password, password);
        console.log(`   Final verification: ${finalTest}`);
      }
      
    } catch (verifyError) {
      console.log(`   ❌ Verification error: ${verifyError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

debugLogin();