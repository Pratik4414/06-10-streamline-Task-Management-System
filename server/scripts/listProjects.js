import mongoose from 'mongoose';
import Project from '../models/Project.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const projects = await Project.find({}).select('_id name status priority');
    
    console.log('📋 Projects in Database:');
    console.log('═'.repeat(70));
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Priority: ${project.priority}`);
      console.log('');
    });
    
    console.log('═'.repeat(70));
    console.log(`\nTotal Projects: ${projects.length}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listProjects();
