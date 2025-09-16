
import React, { useState, useEffect } from 'react';
import { createProject, getTeamMembers } from '../services/api.js';
import './CreateProjectModal.css';

const CreateProjectModal = ({ projects, setProjects, setShowModal }) => {
    const [team, setTeam] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        getTeamMembers()
          .then(res => setTeam(res.data))
          .catch(err => console.error("Could not fetch team members", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedMembers = Array.from(e.target.members.selectedOptions, option => option.value);
        const newProject = {
            name: e.target.name.value,
            description: e.target.description.value,
            members: selectedMembers
        };
        try {
            const { data } = await createProject(newProject);
            // Add the newly created project to the top of the list
            setProjects([data, ...projects]);
            setShowModal(false);
        } catch (err) {
            console.error("Failed to create project", err);
            setError("Error: Could not create project.");
        }
    };

    return (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                      <label>Project Name</label>
                      <input name="name" placeholder="e.g., Q4 Marketing Campaign" required />
                    </div>
                    <div className="input-group">
                      <label>Description</label>
                      <textarea name="description" placeholder="A brief description of the project goals." rows="3"></textarea>
                    </div>
                    <div className="input-group">
                      <label>Assign Team Members</label>
                      <select name="members" multiple required>
                          {team.map(member => <option key={member._id} value={member._id}>{member.name} ({member.email})</option>)}
                      </select>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary">Create Project</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;