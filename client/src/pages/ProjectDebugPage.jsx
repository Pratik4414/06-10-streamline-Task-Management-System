import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';

const ProjectDebugPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        console.log('Debug - Projects response:', response);
        setProjects(response.data);
      } catch (err) {
        console.error('Debug - Error fetching projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Project Debug Page</h1>
      <p>Available Projects for Testing:</p>
      
      {projects.map(project => (
        <div key={project._id} style={{ 
          border: '1px solid #ccc', 
          margin: '1rem 0', 
          padding: '1rem',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>{project.name}</h3>
          <p><strong>ID:</strong> {project._id}</p>
          <p><strong>Status:</strong> {project.status}</p>
          <p><strong>Members:</strong> {project.members?.length || 0}</p>
          <p><strong>Tasks:</strong> {project.tasks?.length || 0}</p>
          
          <div style={{ marginTop: '1rem' }}>
            <Link 
              to={`/projects/${project._id}`}
              style={{ 
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                marginRight: '0.5rem'
              }}
            >
              View Project Details
            </Link>
            
            <button
              onClick={() => {
                console.log('Project data:', project);
                window.open(`http://localhost:5000/api/projects/${project._id}`, '_blank');
              }}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Test API Directly
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectDebugPage;