import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Delete existing test user
    await User.deleteOne({ email: 'test@gmail.com' });
    
    // Create simple test user
    const password = 'Test123!';
    const hashedPassword = await argon2.hash(password);
    
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@gmail.com',
      password: hashedPassword,
      role: 'employee',
      twoFactor: {
        backupCodes: []
      }
    });
    
    console.log('✅ Test user created:', testUser.name);
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password:', password);
    
    // Test the password immediately
    const isValid = await argon2.verify(hashedPassword, password);
    console.log('✅ Password verification test:', isValid ? 'PASS' : 'FAIL');
    
    // Test fresh query
    const freshUser = await User.findOne({ email: 'test@gmail.com' });
    const freshTest = await argon2.verify(freshUser.password, password);
    console.log('✅ Fresh query test:', freshTest ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUser();