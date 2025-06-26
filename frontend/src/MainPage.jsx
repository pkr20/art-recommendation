import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/api/firebase';

export default function MainPage() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
      <h1>the Main Page!</h1>
      <p>You have successfully signed in.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}