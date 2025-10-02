import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const APITestPage = () => {
  const { user, token } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results = {};
    
    console.log('=== API Test Debug ===');
    console.log('User:', user);
    console.log('Token:', token);
    console.log('API_URL from env:', import.meta.env.VITE_API_URL);
    
    // Test 1: Direct fetch to projects list
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      results.projectsList = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      results.projectsList = {
        error: error.message
      };
    }

    // Test 2: Test a specific project ID if we have one
    if (results.projectsList.ok && results.projectsList.data.length > 0) {
      const projectId = results.projectsList.data[0]._id;
      try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        results.singleProject = {
          projectId,
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        results.singleProject = {
          projectId,
          error: error.message
        };
      }
    }

    console.log('Test results:', results);
    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      runTests();
    }
  }, [token]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Authentication Status</h2>
        <p>User: {user ? user.name : 'Not logged in'}</p>
        <p>Token exists: {token ? 'Yes' : 'No'}</p>
        <p>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</p>
      </div>

      <button onClick={runTests} disabled={!token || isLoading}>
        {isLoading ? 'Testing...' : 'Run API Tests'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <h2>Test Results</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      {testResults.projectsList?.ok && testResults.projectsList.data.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Available Projects</h2>
          {testResults.projectsList.data.map((project, index) => (
            <div key={project._id} style={{ 
              border: '1px solid #ccc', 
              padding: '10px', 
              margin: '5px 0',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9'
            }}>
              <strong>{project.name}</strong>
              <br />
              ID: {project._id}
              <br />
              <a href={`/projects/${project._id}`} target="_blank" rel="noopener noreferrer">
                Open Project Detail Page
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default APITestPage;