import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import Card from './Card';
import SearchBar from './SearchBar';
import Header from './Header';
import { rankSearchResults } from '../utils/recommendationAlgo';
import {
  expandSearchTermsFuzzy,
  getSuggestions,
  SYNONYM_GROUPS,
  filterPlacesFuzzySynonym
} from '../utils/searchAlgorithm';
import Loader from './Loader';

export default function MainPage({ user, setUser }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('')
  const [places, setPlaces] = useState([]);
  const [placeType, setPlaceType] = useState('art_gallery');
  const [viewMode, setViewMode] = useState('list'); // list or map
  const [useKeyword, setUseKeyword] = useState(false); // for keyword-based search
  const [keywordValue, setKeywordValue] = useState('art fair'); // which keyword to use

  // User location state
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // search history and user interaction tracking
  const [searchHistory, setSearchHistory] = useState([]);
  const [userInteractions, setUserInteractions] = useState({});

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  //handle sign out from the main page
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // load search history from localStorage on mount
  useEffect(() => {
    // retrieve saved search history and user interactions from localStorage (if any)
    const savedHistory = localStorage.getItem('artBase_searchHistory');
    const savedInteractions = localStorage.getItem('artBase_userInteractions');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    if (savedInteractions) {
      setUserInteractions(JSON.parse(savedInteractions));
    }
  }, []);

  // save search query to history
  const saveSearchQuery = (query, results, placeType) => {
    if (!query.trim()) return;
    
    // create a new search entry object
    const searchEntry = {
      query: query.toLowerCase(),
      placeType,
      timestamp: new Date().toISOString(),
    };
    
    //add new entry to the front, remove duplicates, and keep only the last 50
    const updatedHistory = [searchEntry, ...searchHistory.filter(h => h.query !== query.toLowerCase())].slice(0, 50); // keep last 50 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('artBase_searchHistory', JSON.stringify(updatedHistory)); //persist to localStorage
  };

  // track user interaction with a place
  const trackUserInteraction = (place, interactionType) => {
    const timestamp = new Date().toISOString();
    const updatedInteractions = {
      ...userInteractions,
      [place.place_id]: {
        ...userInteractions[place.place_id],
        [interactionType]: timestamp,
        lastInteraction: timestamp,
        types: place.types,
        name: place.name
      }
    };
    
    //update state and persist to localStorage
    setUserInteractions(updatedInteractions);
    localStorage.setItem('artBase_userInteractions', JSON.stringify(updatedInteractions));
  };





  // get user's most searched terms
  const getUserMostSearched = () => {
    const queryCounts = {};
    searchHistory.forEach(entry => {
      queryCounts[entry.query] = (queryCounts[entry.query] || 0) + 1;
    });
    return Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query]) => query);
  };

  // get user's preferred place types
  const getUserPreferredPlaceTypes = () => {
    const typeCounts = {};
    searchHistory.forEach(entry => {
      typeCounts[entry.placeType] = (typeCounts[entry.placeType] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);
  };

  // get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoadingLocation(false);
        },
        (error) => {
          setLocationError('Unable to retrieve your location.');
          setLocation({ lat: 40.7128, lng: -74.0060 }); // fallback to NYC
          setLoadingLocation(false);
        }
      );
    } else {
      setLocationError('Location is not supported.');
      setLocation({ lat: 40.7128, lng: -74.0060 }); // fallback to NYC
      setLoadingLocation(false);
    }
  }, []);

  //gets the google maps API information for nearby locations to render
  useEffect(() => {
    if (!location) return;
    setLoadingPlaces(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        const map= document.createElement('div')
        const service = new window.google.maps.places.PlacesService(map);
        const requestType = {
          location,
          radius: 50000,
          type: placeType, 
        };
        const requestKeyword = {
          location,
          radius: 50000,
          keyword: keywordValue,
        };
        if (useKeyword) {
          // only fetch by keyword
          service.nearbySearch(requestKeyword, (resultsKeyword, statusKeyword) => {
            if (statusKeyword === window.google.maps.places.PlacesServiceStatus.OK && resultsKeyword.length > 0) {
              setPlaces(resultsKeyword);
            } else {
              setPlaces([]);
            }
            setTimeout(() => setLoadingPlaces(false), 1000);
          });
        } else {
          // fetch by type, then also fetch by keyword and merge
          service.nearbySearch(requestType, (resultsType, statusType) => {
            let allResults = [];
            if (statusType === window.google.maps.places.PlacesServiceStatus.OK && resultsType.length > 0) {
              allResults = resultsType;
            }
            // fetch by keyword and merge
            service.nearbySearch({ ...requestKeyword, keyword: 'art fair' }, (resultsKeyword, statusKeyword) => {
              if (statusKeyword === window.google.maps.places.PlacesServiceStatus.OK && resultsKeyword.length > 0) {
                const merged = [...allResults, ...resultsKeyword].reduce((acc, place) => {
                  if (!acc.some(p => p.place_id === place.place_id)) {
                    acc.push(place);
                  }
                  return acc;
                }, []);
                // now also fetch exhibitions and merge
                service.nearbySearch({ ...requestKeyword, keyword: 'exhibition' }, (resultsExhibition, statusExhibition) => {
                  if (statusExhibition === window.google.maps.places.PlacesServiceStatus.OK && resultsExhibition.length > 0) {
                    const mergedAll = [...merged, ...resultsExhibition].reduce((acc, place) => {
                      if (!acc.some(p => p.place_id === place.place_id)) {
                        acc.push(place);
                      }
                      return acc;
                    }, []);
                    setPlaces(mergedAll);
                  } else {
                    setPlaces(merged);
                  }
                  setTimeout(() => setLoadingPlaces(false), 1000);
                });
              } else {
                // if no art fair results, just fetch exhibitions and merge with type
                service.nearbySearch({ ...requestKeyword, keyword: 'exhibition' }, (resultsExhibition, statusExhibition) => {
                  if (statusExhibition === window.google.maps.places.PlacesServiceStatus.OK && resultsExhibition.length > 0) {
                    const mergedAll = [...allResults, ...resultsExhibition].reduce((acc, place) => {
                      if (!acc.some(p => p.place_id === place.place_id)) {
                        acc.push(place);
                      }
                      return acc;
                    }, []);
                    setPlaces(mergedAll);
                  } else {
                    setPlaces(allResults);
                  }
                  setTimeout(() => setLoadingPlaces(false), 1000); 
                });
              }
            });
          });
        }
      }
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [placeType, location, searchInput, useKeyword, keywordValue]);

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


  const filteredPlaces = filterPlacesFuzzySynonym(places, searchInput);
  

  //rank filtered results using recommendation algorithm
  const rankedSearchResults = searchInput.trim() && location
    ? rankSearchResults(filteredPlaces, location)
    : filteredPlaces;
  
  //log recommendation scores for each result
  if (rankedSearchResults.length && rankedSearchResults[0].rankScore !== undefined) {
    rankedSearchResults.forEach((place, idx) => {
      
    });
  }

  // helper function to render a Card for a place
  function renderPlaceCard(place, id) {
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
      types: place.types
    };
    return (
      <Card
        key={place.place_id || id}
        name={place.name}
        location={place.vicinity}
        image={photoUrl}
        placeId={place.place_id}
        place={placeObject}
        // track when a user clicks/views a card
        onCardClick={() => trackUserInteraction(place, 'viewed')}
      />
    );
  }

  return (
    <div className='main-page-container'>
      {loadingLocation ? (
        <div>Loading your location...</div>
      ) : locationError ? (
        <div>{locationError}</div>
      ) : null}
      <Header searchInput={searchInput} setSearchInput={setSearchInput} places={places} user={user} setUser={setUser}/>

      <div className="hero-section">
        <h1>Discover Amazing Art Scenes</h1>
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
          <button className={`filter-btn ${placeType === 'art_gallery' && !useKeyword ? 'active' : ''}`}
            onClick={() => { setPlaceType('art_gallery'); setUseKeyword(false); }}>
            Art Galleries
          </button>
          <button className={`filter-btn ${placeType === 'museum' && !useKeyword ? 'active' : ''}`}
            onClick={() => { setPlaceType('museum'); setUseKeyword(false); }}>
            Museums
          </button>
          <button className={`filter-btn ${useKeyword && keywordValue === 'art fair' ? 'active' : ''}`}
            onClick={() => { setUseKeyword(true); setKeywordValue('art fair'); }}>
            Art Fairs
          </button>
          <button className={`filter-btn ${useKeyword && keywordValue === 'exhibition' ? 'active' : ''}`}
            onClick={() => { setUseKeyword(true); setKeywordValue('exhibition'); }}>
            Exhibitions
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
            {loadingPlaces ? <Loader /> : rankedSearchResults.map(renderPlaceCard)}
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