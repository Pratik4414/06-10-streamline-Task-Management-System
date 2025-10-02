import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testSingleUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'david.frontend@hotmail.com';
    const password = 'David123!@';
    
    console.log(`🔧 Force updating password for: ${email}`);
    
    // Create fresh hash
    const newHash = await argon2.hash(password);
    console.log(`Generated hash: ${newHash.substring(0, 30)}...`);
    
    // Update directly with findOneAndUpdate
    const updated = await User.findOneAndUpdate(
      { email: email },
      { password: newHash },
      { new: true }
    );
    
    console.log(`Updated user: ${updated.name}`);
    console.log(`New stored hash: ${updated.password.substring(0, 30)}...`);
    
    // Test immediately
    const testResult = await argon2.verify(updated.password, password);
    console.log(`✅ Immediate verification test: ${testResult ? 'PASS' : 'FAIL'}`);
    
    // Test fresh query
    const freshUser = await User.findOne({ email: email });
    const freshTest = await argon2.verify(freshUser.password, password);
    console.log(`✅ Fresh query verification test: ${freshTest ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testSingleUser();