import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import Card from './Card';
import SearchBar from './SearchBar';
import Header from './Header';

export default function MainPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('')
  const [places, setPlaces] = useState([]);
  const [placeType, setPlaceType] = useState('art_gallery');
  const [viewMode, setViewMode] = useState('list'); // list or map

  const location = { lat: 40.7128, lng: -74.0060 };

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

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
          type: placeType, 
          //query: 'art fair',
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
  }, [placeType]);

  // map creating marker logic
  useEffect(() => {
    if (!window.google || !window.google.maps || places.length === 0) return;
    if (viewMode !== 'map') return;
    
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: places[0].geometry.location,
        zoom: 15,
      });
    } else {
      mapInstance.current.setCenter(places[0].geometry.location);
    }
    // remove old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // add new markers
    places.forEach(place => {
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: mapInstance.current,
        title: place.name,
      });
      markersRef.current.push(marker);
    });
  }, [places, viewMode]);

  // filter places based on search input #technical challenge
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    (place.vicinity && place.vicinity.toLowerCase().includes(searchInput.toLowerCase()))
  );

  return (
    <div className='main-page-container'>
      <Header searchInput={searchInput} setSearchInput={setSearchInput} />

        <div className='filter-container'>

        <button className={`filter-btn ${placeType === 'art_gallery' ? 'active' : ''}`}
          onClick={() => setPlaceType('art_gallery')}>
          Art Galleries
        </button>
        <button className={`filter-btn ${placeType === 'museum' ? 'active' : ''}`}
          onClick={() => setPlaceType('museum')}>
          Museums
        </button>
        <button className='filter-btn' onClick={() => navigate('/favorites')}>
          Favorites
        </button>
      </div>
      <div className='map-toggle-container'>
        <button
          className={`filter-btn${viewMode === 'list' ? ' active' : ''}`}
          onClick={() => setViewMode('list')}
        >List View</button>
        <button
          className={`filter-btn${viewMode === 'map' ? ' active' : ''}`}
          onClick={() => setViewMode('map')}>Map View</button>
      </div>
      {viewMode === 'map' && (
        <div className='map-view-container'>
          <h2>Map View</h2>
          <div
            id="map"
            ref={mapRef}
            style={{ width: '100%', height: '800px' }}
          />
        </div>
      )}
      {viewMode === 'list' && (
        <div className='card-container'>
          {filteredPlaces.map((place, id) => {
            //extract photo url 
            const photoUrl = place.photos && place.photos.length > 0
              ? place.photos[0].getUrl()
              : '/gallery-placeholder.png';
            // serializable place object
            const placeObject = {
              place_id: place.place_id,
              name: place.name,
              vicinity: place.vicinity,
              location: place.location,
              photoUrl,
            };
            return (
              <Card
                key={place.place_id || id}
                name={place.name}
                location={place.vicinity}
                image={photoUrl}
                placeId={place.place_id}
                place={placeObject}
              />
            );
          })}
        </div>
      )}
      <p>You have successfully signed in.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}