import mongoose from 'mongoose';
import Project from '../models/Project.js';

mongoose.connect('mongodb://localhost:27017/project_manager')
  .then(async () => {
    console.log('=== ALL PROJECTS IN DATABASE ===\n');
    const projects = await Project.find({}).select('_id name status');
    projects.forEach(p => {
      console.log(`ID: ${p._id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Status: ${p.status}`);
      console.log('---');
    });
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
