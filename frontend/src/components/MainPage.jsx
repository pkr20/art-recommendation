import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import Card from './Card';
import SearchBar from './SearchBar';
import { useState, useEffect } from 'react';

export default function MainPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('')
  const [userLocation, setUserLocation] = useState('')
  const [nearbyGalleries, setNearbyGalleries] = useState([])

  //function to retrieve userLocation

  //find nearby galleries using Google Places API

  const findNearbyGalleries = async () => {
    //if (!userLocation) return;
    //setError('')
    try {
      const map = new google.maps.Map(document.createElement('div'));
      const service = new google.maps.places.PlacesService(map);

      const request = {
        location: userLocation,
        radius: '5000',
        type: ['art_gallery', 'museum'],
        keyword: 'art gallery mueseum'
      }
    } catch {
      
    }
  }

  

  //handle sign out from the main page
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className='main-page-container'>
      <h1>the Main Page!</h1>
      <SearchBar searchInput={searchInput}
                setSearchInput={setSearchInput} />
      <div className='card-container'>
        {Array.from({ length: 12 }, (_, index) => (
          <Card key={index} />
        ))}
      </div>
     

      <p>You have successfully signed in.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}