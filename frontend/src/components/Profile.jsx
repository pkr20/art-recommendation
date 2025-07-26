import FavoritesPage from './FavoritesPage';
import EditableInput from './EditableInput';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate('/main');
    }
    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <button onClick={handleNavigate}>
                     Main Page
                </button>
            </div>
            
            <div className="profile-content">
                <div className="profile-section">
                    <h2>Personal Information</h2>
                    <div className="profile-info">
                        <div className="info-item">
                            <label>Name:</label>
                            <EditableInput />
                            <label>Email:</label>
                            <EditableInput />
                            <label>Location:</label>
                            <EditableInput />

                        </div>
                    </div>
                </div>
                
                <div className="profile-section">
                    <h2>My Favorites</h2>
                    <div className="favorites-container">
                        <FavoritesPage />
                    </div>
                </div>
                
                <div className="profile-section">
                    <h2>Places I've Visited</h2>
                    <div className="places-list">
                        <p>No visited places yet</p>
                    </div>
                </div>
                
                <div className="profile-section">
                    <h2>Places I Want to Visit</h2>
                    <div className="places-list">
                        <p>No places added to visit list yet</p>
                    </div>
                </div>
                
                <div className="profile-section">
                    <h2>My Reviews</h2>
                    <div className="reviews-list">
                        <p>No reviews yet</p>
                    </div>
                </div>
                
                <div className="profile-section">
                    <h2>My Ratings</h2>
                    <div className="ratings-list">
                        <p>No ratings yet</p>
                    </div>
                </div>
            </div>
        </div>
    )
}