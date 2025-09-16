
import React, { useState, useEffect } from 'react';
import { getTeamMembers, addTeamMember } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import './TeamPage.css';

const AddMemberModal = ({ setShowModal, setTeam }) => {
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        const memberData = {
            name: e.target.name.value,
            email: e.target.email.value,
            password: e.target.password.value,
            role: e.target.role.value,
        };
        const res = await addTeamMember(memberData);
        if (res.success) {
            setTeam(prevTeam => [...prevTeam, res.user]);
            setShowModal(false);
        } else {
            setError(res.error || "Failed to add member.");
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add New Team Member</h2>
                    <button onClick={() => setShowModal(false)} className="close-button"><X size={24}/></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <input name="name" placeholder="Full Name" required />
                    <input name="email" type="email" placeholder="Email Address" required />
                    <input name="password" type="password" placeholder="Temporary Password" required />
                    <select name="role" defaultValue="employee">
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                    </select>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary">Add Member</button>
                </form>
            </div>
        </div>
    );
};

const TeamPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (user?.role !== 'manager') {
            navigate('/dashboard');
            return;
        }
        getTeamMembers().then(res => setTeam(res.data));
    }, [navigate, user]);

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Team Management</h1>
                <button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus size={18}/> Invite New Member</button>
            </header>
            <div className="team-table-container">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map(member => (
                            <tr key={member._id}>
                                <td>{member.name}</td>
                                <td>{member.email}</td>
                                <td><span className={`role-badge ${member.role.toLowerCase()}`}>{member.role}</span></td>
                                <td><button className="btn-secondary">Edit Role</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showAddModal && <AddMemberModal setShowModal={setShowAddModal} setTeam={setTeam} />}
        </div>
    );
};

export default TeamPage;