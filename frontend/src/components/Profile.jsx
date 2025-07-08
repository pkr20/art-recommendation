import FavoritesPage from './FavoritesPage';
import EditableInput from './EditableInput';

export default function Profile() {
    return (
        <div>
            <h1>Profile</h1>
            <h2>Name: <EditableInput /></h2>
            <h2><FavoritesPage></FavoritesPage></h2>
            <h2>Visited Places: </h2>
            <h2>To Visit Places: </h2>
            <h2>Reviews: </h2>
            <h2>Ratings: </h2>
            <h2>Edit Profile</h2>
            <h2>Sign Out</h2>
        </div>
    )
}