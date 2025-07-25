import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Header from './Header';
import Loader from './Loader';
import { rankSearchResults } from '../utils/recommendationAlgo';

export default function RecommendedPage({ user, setUser }) {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [places, setPlaces] = useState([]);
    const [recommendedPlaces, setRecommendedPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    //get user's actual location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setLocationError('Unable to get your location. Using default location.');
                    //if cannot get user location
                    setUserLocation({ lat: 40.7128, lng: -74.0060 });
                }
            );
        } else {
            setLocationError('Location is not supported by this browser. Using default location.');
            setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
    }, []);

    useEffect(() => {
        if (!userLocation) return; // Wait for location to be set
        setLoading(true);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => {
            if (window.google && window.google.maps) {
                const map = document.createElement('div');
                const service = new window.google.maps.places.PlacesService(map);
                const requestGallery = {
                    location: userLocation,
                    radius: 50000,
                    type: 'art_gallery',
                };
                const requestMuseum = {
                    location: userLocation,
                    radius: 50000,
                    type: 'museum',
                };
                const requestArtFair = {
                    location: userLocation,
                    radius: 50000,
                    keyword: 'art fair',
                };
                const requestExhibition = {
                    location: userLocation,
                    radius: 50000,
                    keyword: 'exhibition',
                };
                // fetch art galleries
                service.nearbySearch(requestGallery, (resultsGallery, statusGallery) => {
                    let allResults = [];
                    if (statusGallery === window.google.maps.places.PlacesServiceStatus.OK && resultsGallery.length > 0) {
                        allResults = resultsGallery;
                    }
                    // fetch museums
                    service.nearbySearch(requestMuseum, (resultsMuseum, statusMuseum) => {
                        if (statusMuseum === window.google.maps.places.PlacesServiceStatus.OK && resultsMuseum.length > 0) {
                            allResults = [...allResults, ...resultsMuseum];
                        }
                        // fetch art fairs
                        service.nearbySearch(requestArtFair, (resultsArtFair, statusArtFair) => {
                            if (statusArtFair === window.google.maps.places.PlacesServiceStatus.OK && resultsArtFair.length > 0) {
                                // tag art fair results
                                resultsArtFair.forEach(place => {
                                    if (!place.types) place.types = [];
                                    if (!place.types.includes('art_fair')) place.types.push('art_fair');
                                });
                                allResults = [...allResults, ...resultsArtFair];
                            }
                            // fetch exhibitions
                            service.nearbySearch(requestExhibition, (resultsExhibition, statusExhibition) => {
                                if (statusExhibition === window.google.maps.places.PlacesServiceStatus.OK && resultsExhibition.length > 0) {
                                    // tag exhibition results
                                    resultsExhibition.forEach(place => {
                                        if (!place.types) place.types = [];
                                        if (!place.types.includes('exhibition')) place.types.push('exhibition');
                                    });
                                    allResults = [...allResults, ...resultsExhibition];
                                }
                                // merge all results, removing duplicates by place_id
                                const merged = allResults.reduce((acc, place) => {
                                    if (!acc.some(p => p.place_id === place.place_id)) {
                                        acc.push(place);
                                    }
                                    return acc;
                                }, []);
                                setPlaces(merged);
                                setTimeout(() => {
                                    setLoading(false);
                                }, 3000);
                            });
                        });
                    });
                });
            }
        };
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [userLocation]);

    //use shared recommendation algorithm after places are loaded
    useEffect(() => {
        if (places.length === 0 || !userLocation) return;

        
        
       //from recommendationAlgo.js
        const rankedPlaces = rankSearchResults(places, userLocation);
        setRecommendedPlaces(rankedPlaces);
        
        
        rankedPlaces.slice(0, 3).forEach((place, index) => {
            
        });
    }, [places, userLocation]);

    //filter by search input
    const filteredPlaces = recommendedPlaces.filter(place =>
        place.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        (place.vicinity && place.vicinity.toLowerCase().includes(searchInput.toLowerCase()))
    );

    return (
        <div className='main-page-container'>
            <Header searchInput={searchInput} setSearchInput={setSearchInput} user={user} setUser={setUser} />
            <h1>Recommended For You</h1>
            {locationError && (
                <div className="location-notice">
                    <p>{locationError}</p>
                </div>
            )}
            {userLocation && !locationError && (
                <div className="location-notice">
                    <p>📍 Finding galleries near your location</p>
                </div>
            )}
            <div className='filter-container'>
                <button className='filter-btn' onClick={() => navigate('/main')}>
                    ← Back to Main
                </button>
            </div>
            <div className='card-container'>
                {loading ? (
                    <Loader />
                ) : filteredPlaces.length === 0 ? (
                    <div>No recommendations found.</div>
                ) : (
                    filteredPlaces.map((place, id) => {
                        const photoUrl = place.photos && place.photos.length > 0
                            ? place.photos[0].getUrl()
                            : '/gallery-placeholder.png';
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