import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({}).select('name email twoFactor.backupCodes');
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Backup codes: ${user.twoFactor?.backupCodes?.length || 0}`);
    });
    
    // Test specific user
    const testUser = await User.findOne({ email: 'david.frontend@hotmail.com' });
    if (testUser) {
      console.log('\n🔍 Test user details:');
      console.log(`Name: ${testUser.name}`);
      console.log(`Email: ${testUser.email}`);
      console.log(`Has password: ${!!testUser.password}`);
      console.log(`Backup codes count: ${testUser.twoFactor?.backupCodes?.length || 0}`);
    } else {
      console.log('\n❌ Test user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkUsers();