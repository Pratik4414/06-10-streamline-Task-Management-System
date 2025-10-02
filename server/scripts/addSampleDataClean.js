import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/project_mgmt');
    console.log('Connected to MongoDB');
    
    // Add sample tasks and update projects with realistic data
    const projects = await Project.find().populate('team.members.user');
    const users = await User.find();
    
    console.log(`Found ${projects.length} projects and ${users.length} users`);
    
    for (const project of projects) {
      console.log(`Processing project: ${project.name}`);
      
      // Add realistic comments
      const comments = [
        {
          user: users[0]._id,
          text: 'Great progress on this project! The initial setup looks solid.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          user: users[1]._id,
          text: 'I have completed the database schema design. Ready for review.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          user: users[2]._id,
          text: 'UI wireframes are ready. Please check the latest designs.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      
      // Add sample tasks based on project
      let sampleTasks = [];
      
      if (project.name.includes('API')) {
        sampleTasks = [
          {
            title: 'Database Schema Design',
            description: 'Design and implement the database schema for user management and data storage',
            status: 'Done',
            priority: 'High',
            assignedTo: users[0]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            estimatedHours: 16,
            actualHours: 14
          },
          {
            title: 'REST API Endpoints',
            description: 'Create comprehensive REST API endpoints for all core functionalities',
            status: 'In Progress',
            priority: 'High',
            assignedTo: users[1]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            estimatedHours: 24,
            actualHours: 18
          },
          {
            title: 'API Documentation',
            description: 'Write comprehensive API documentation with examples',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: users[2]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            estimatedHours: 12,
            actualHours: 0
          }
        ];
      } else if (project.name.includes('Website')) {
        sampleTasks = [
          {
            title: 'UI/UX Design System',
            description: 'Create a comprehensive design system with components and guidelines',
            status: 'Done',
            priority: 'High',
            assignedTo: users[2]._id,
            project: project._id,
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            estimatedHours: 20,
            actualHours: 22
          },
          {
            title: 'Responsive Layout Implementation',
            description: 'Implement responsive layouts for all pages using modern CSS',
            status: 'In Progress',
            priority: 'High',
            assignedTo: users[1]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
            estimatedHours: 28,
            actualHours: 15
          },
          {
            title: 'Performance Optimization',
            description: 'Optimize website performance and loading speeds',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: users[0]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
            estimatedHours: 16,
            actualHours: 0
          }
        ];
      } else if (project.name.includes('E-commerce')) {
        sampleTasks = [
          {
            title: 'Product Catalog System',
            description: 'Build dynamic product catalog with search and filtering',
            status: 'Done',
            priority: 'High',
            assignedTo: users[0]._id,
            project: project._id,
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            estimatedHours: 32,
            actualHours: 35
          },
          {
            title: 'Shopping Cart & Checkout',
            description: 'Implement shopping cart functionality and secure checkout process',
            status: 'In Progress',
            priority: 'High',
            assignedTo: users[1]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
            estimatedHours: 40,
            actualHours: 25
          },
          {
            title: 'Payment Gateway Integration',
            description: 'Integrate multiple payment gateways for secure transactions',
            status: 'To Do',
            priority: 'High',
            assignedTo: users[2]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            estimatedHours: 24,
            actualHours: 0
          },
          {
            title: 'Order Management System',
            description: 'Build comprehensive order tracking and management system',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: users[0]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            estimatedHours: 20,
            actualHours: 0
          }
        ];
      } else {
        // Default tasks for other projects
        sampleTasks = [
          {
            title: 'Project Planning & Analysis',
            description: 'Analyze requirements and create detailed project plan',
            status: 'Done',
            priority: 'High',
            assignedTo: users[0]._id,
            project: project._id,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            estimatedHours: 8,
            actualHours: 10
          },
          {
            title: 'Core Development',
            description: 'Implement core functionality and features',
            status: 'In Progress',
            priority: 'High',
            assignedTo: users[1]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            estimatedHours: 50,
            actualHours: 20
          },
          {
            title: 'Testing & Quality Assurance',
            description: 'Comprehensive testing and quality assurance',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: users[2]._id,
            project: project._id,
            dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
            estimatedHours: 16,
            actualHours: 0
          }
        ];
      }
      
      // Calculate realistic progress based on completed tasks
      const completedTasks = sampleTasks.filter(task => task.status === 'Done').length;
      const inProgressTasks = sampleTasks.filter(task => task.status === 'In Progress').length;
      const totalTasks = sampleTasks.length;
      const progress = Math.round(((completedTasks + (inProgressTasks * 0.5)) / totalTasks) * 100);
      
      // Update project with sample data
      await Project.findByIdAndUpdate(project._id, {
        comments: comments,
        progress: progress,
        $push: { 
          activityLog: {
            action: 'Project Updated',
            user: users[0]._id,
            details: 'Added realistic sample tasks and project data for demonstration',
            timestamp: new Date()
          }
        }
      });
      
      // Delete existing tasks for this project to avoid duplicates
      await Task.deleteMany({ project: project._id });
      
      // Create new tasks for this project
      for (const taskData of sampleTasks) {
        await Task.create(taskData);
      }
      
      console.log(`Added ${sampleTasks.length} tasks to project: ${project.name}`);
    }
    
    console.log('Sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

main();