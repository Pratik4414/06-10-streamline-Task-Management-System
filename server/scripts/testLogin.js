import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'david.frontend@hotmail.com';
    const password = 'David123!@';
    
    console.log(`\n🔍 Testing login for: ${email}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.name}`);
    
    // Verify password
    const passwordValid = await argon2.verify(user.password, password);
    console.log(`Password valid: ${passwordValid}`);
    
    // Check backup codes
    const hasBackupCodes = user.twoFactor?.backupCodes && user.twoFactor.backupCodes.length > 0;
    console.log(`Has backup codes: ${hasBackupCodes}`);
    console.log(`Backup codes count: ${user.twoFactor?.backupCodes?.length || 0}`);
    
    if (!hasBackupCodes) {
      // Should get grace period token
      const gracePeriodToken = jwt.sign({ 
        user: { id: user.id, role: user.role },
        gracePeriod: true,
        mustSetupBackupCodes: true
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      console.log('\n✅ Should receive grace period response:');
      console.log({
        success: true,
        token: 'GRACE_PERIOD_TOKEN',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        gracePeriod: true,
        mustSetupBackupCodes: true,
        message: "Please set up backup codes immediately for security."
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testLogin();