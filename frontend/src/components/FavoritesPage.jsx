import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../backend/api/firebase';
import Card from './Card';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  

  //fetch favorites from backend
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      //fetch favorite place IDs from backend
      const response = await fetch('http://localhost:3000/favorites', {
        credentials: 'include'
      });
      const favoritesData = await response.json();
      
      //favorites and Google Maps API is available
      if (favoritesData.length > 0 && window.google && window.google.maps) {
        const mapDiv = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(mapDiv);
        
        const favoritePlacesData = [];
        let completedRequests = 0; 
        
        //loop through each favorite
        favoritesData.forEach((favorite) => {
          service.getDetails({ placeId: favorite.placeId }, (result, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              favoritePlacesData.push(result);
            }
            completedRequests++;
            
            // when all requests are complete, update state
            if (completedRequests === favoritesData.length) {
              setFavoritePlaces(favoritePlacesData);
              setLoading(false);
            }
          });
        });
      } else {
        //if no favorites or Google Maps not available
        setFavoritePlaces([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
    }
  };

  useEffect(() => {

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
   
    script.onload = () => {
      if (window.google && window.google.maps) {
        fetchFavorites();
      }
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className='main-page-container'>
      <h1>My Favorites</h1>
      
      <div className='filter-container'>
        <button className='filter-btn' onClick={() => navigate('/main')}>
          ← Back to Main
        </button>
      </div>

      <div className='card-container'>
        {loading ? (
          <div >
            Loading favorites...
          </div>
        ) : favoritePlaces.length === 0 ? (
          <div className='no-favorites'>
            No favorites yet. Add some places to your favorites!
          </div>
        ) : (
          favoritePlaces.map((place, id) => {
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
          })
        )}
      </div>
    </div>
  );
}