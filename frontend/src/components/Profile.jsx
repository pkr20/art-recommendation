import FavoritesPage from './FavoritesPage';
import EditableInput from './EditableInput';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const handleSignOut = () => {
        signOut(auth);
        navigate('/signin');
    }
    return (
        <div>
            <h1>Profile</h1>
            <h2>Name: <EditableInput /></h2>
            <h2><FavoritesPage></FavoritesPage></h2>
            <h2>Visited Places: </h2>
            <h2>To Visit Places: </h2>
            <h2>Reviews: </h2>
            <h2>Ratings: </h2>
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    )
}