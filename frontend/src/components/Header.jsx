import SearchBar from './SearchBar';
import { useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import { useState } from 'react';
import { logoutFromBackend } from '../utils/sessionApi';

export default function Header({searchInput, setSearchInput, places, user, setUser}) {
    const navigate = useNavigate();
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    const openSignIn = () => {
        //only open sign-in modal if user is not already logged in
        if (!user) {
            setIsSignInOpen(true);
        }
    };

    const closeSignIn = () => {
        setIsSignInOpen(false);
    };
    const handleSignOut = async () => {
        try {
            await logoutFromBackend();
            setUser(null);
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <div className="header">
            <h1>ArtBase</h1>
            <SearchBar searchInput={searchInput} setSearchInput={setSearchInput} places={places}/>
            {user ? (
                <button className='header-btn' onClick={handleSignOut}>Sign Out</button>
            ) : (
                <button className='header-btn' onClick={openSignIn}>Sign In</button>
            )}
            <button className='header-btn' onClick={() => navigate('/profile')}>Profile</button>
            <button className='header-btn' onClick={() => navigate('/recommended')}>Recommended</button>
            
            <SignIn isOpen={isSignInOpen} onClose={closeSignIn} setUser={setUser} />
        </div>
    )
}