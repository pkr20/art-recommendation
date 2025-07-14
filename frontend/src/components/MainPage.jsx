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

      <div className="hero-section">
        <h1>Discover Amazing Art Galleries</h1>
        <p>Find the best art galleries, museums, and cultural spaces near you. Get personalized recommendations and explore the vibrant art scene in your area.</p>
        <div className="hero-buttons">
          <button className="hero-button1" onClick={() => navigate('/recommended')}>
            Get Personalized Recommendations
          </button>
          <button className="hero-button2" onClick={() => setViewMode('list')}>
            Browse All Galleries
          </button>
        </div>
      </div>

 
      <div className="features-section">
        <h2>Why Explore ArtBase?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Personalized Recommendations</h3>
            <p>Get art gallery suggestions tailored to your preferences and location</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Location-Based Search</h3>
            <p>Find galleries near you with real-time location detection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Curated Collections</h3>
            <p>Discover the best exhibitions and art events in your area</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Save Your Favorites</h3>
            <p>Keep track of galleries you love and want to visit</p>
          </div>
        </div>
      </div>


      <div className="browser-section">
        <h2>Explore Local Art Scene</h2>
        <p>Browse through art galleries and museums in your area</p>
        
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
            <h3>Map View</h3>
            <div
              id="map"
              ref={mapRef}
              style={{ width: '100%', height: '600px' }}
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
      </div>


      <div className="footer-section">
        <p>Ready to explore? Start your art journey today!</p>
        <button className="hero-button1" onClick={() => navigate('/recommended')}>
          Get Started
        </button>
      </div>
    </div>
  );
}