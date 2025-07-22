import SearchBar from './SearchBar';
import { useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
export default function Header({searchInput, setSearchInput, places}) {
    const navigate = useNavigate();
    return (
        <div className="header">
            <h1>ArtBase</h1>
            <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} places={places}/>
            <button className='header-btn' onClick={() => navigate('/signin')}>Sign In</button>
            <button className='header-btn' onClick={() => navigate('/profile')}>Profile</button>
            <button className='header-btn' onClick={() => navigate('/recommended')}>Recommended</button>
        </div>
    )
}