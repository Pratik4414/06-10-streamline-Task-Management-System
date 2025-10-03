import mongoose from 'mongoose';
import User from '../models/User.js';
import argon2 from 'argon2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

async function testManagerLogin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/project_mgmt';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = 'john.manager@gmail.com';
    const password = 'Manager123!@';

    console.log(`\n🔍 Testing login for: ${email}`);
    console.log(`🔐 Testing password: ${password}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.name}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`🔒 Stored hash: ${user.password.substring(0, 50)}...`);

    const isValid = await argon2.verify(user.password, password);
    console.log(`🔐 Password valid: ${isValid}`);

    if (isValid) {
      console.log('\n🎉 LOGIN SUCCESS! The credentials work correctly.');
      console.log('\n✅ You can now use these credentials in the frontend:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('\n❌ LOGIN FAILED! Password does not match.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
  }
}

testManagerLogin();