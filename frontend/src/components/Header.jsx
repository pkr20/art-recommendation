import SearchBar from './SearchBar';
import { useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import { useState } from 'react';

export default function Header({searchInput, setSearchInput, places}) {
    const navigate = useNavigate();
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    const openSignIn = () => {
        setIsSignInOpen(true);
    };

    const closeSignIn = () => {
        setIsSignInOpen(false);
    };

    return (
        <div className="header">
            <h1>ArtBase</h1>
            <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} places={places}/>
            <button className='header-btn' onClick={openSignIn}>Sign In</button>
            <button className='header-btn' onClick={() => navigate('/profile')}>Profile</button>
            <button className='header-btn' onClick={() => navigate('/recommended')}>Recommended</button>
            
            <SignIn isOpen={isSignInOpen} onClose={closeSignIn} />
        </div>
    )
}