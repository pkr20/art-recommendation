import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import Card from './Card';
import SearchBar from './SearchBar';
import { useState } from 'react';

export default function MainPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('')
  const [places, setPlaces] = useState([]);

  const location = { lat: 40.7128, lng: -74.0060 };

  //handle sign out from the main page
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  //gets the google maps API information for nearby locations to render
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        const map= document.createElement('div')
        const service = new window.google.maps.places.PlacesService(map);
        const request = {
          location,
          radius: 50000,
          //type: ['art_gallery'], 
          };
          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
              setPlaces(results);
            }
          });
        }
      };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);



  return (
    <div className='main-page-container'>
      <h1>the Main Page!</h1>
      <SearchBar searchInput={searchInput}
                setSearchInput={setSearchInput} />
      <div className='card-container'>
      {places.map((place, id) => (
          <Card
            key={place.place_id || id}
            name={place.name}
            location={place.vicinity}
            image={place.photos && place.photos.length > 0
              ? place.photos[0].getUrl()
              : '/gallery-placeholder.png'}
          />
          
        ))}
        <Card
  name="Test Gallery"
  location="123 Test St, New York, NY"
  image="/gallery-placeholder.png"
/>
      
      </div>
     

      <p>You have successfully signed in.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}