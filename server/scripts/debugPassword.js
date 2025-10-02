import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const debugPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'david.frontend@hotmail.com';
    const password = 'David123!@';
    
    // Find user
    const user = await User.findOne({ email });
    console.log(`User found: ${user.name}`);
    console.log(`Stored password hash length: ${user.password.length}`);
    console.log(`Hash starts with: ${user.password.substring(0, 20)}...`);
    
    // Test the exact password from seed data
    console.log(`\nTesting password: "${password}"`);
    
    // Try verifying
    try {
      const isValid = await argon2.verify(user.password, password);
      console.log(`Verification result: ${isValid}`);
    } catch (err) {
      console.log(`Verification error: ${err.message}`);
    }
    
    // Create a new hash to compare
    console.log('\nCreating new hash for comparison:');
    const newHash = await argon2.hash(password);
    console.log(`New hash: ${newHash.substring(0, 20)}...`);
    
    const testNewHash = await argon2.verify(newHash, password);
    console.log(`New hash verification: ${testNewHash}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

debugPassword();