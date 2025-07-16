import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Header from './Header';

export default function RecommendedPage() {
    // eucledian distance algo
    function calculateDistance(userLocation, placeLocation) {
        // userLocation: {lat, lng}, placeLocation: google.maps.LatLng
        const lat1 = userLocation.lat;
        const lng1 = userLocation.lng;
        //Google Maps use .lat() and .lng()
        const lat2 = typeof placeLocation.lat === 'function' ? placeLocation.lat() : placeLocation.lat;
        const lng2 = typeof placeLocation.lng === 'function' ? placeLocation.lng() : placeLocation.lng;
        const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
        return distance;
    }

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
                const requestKeyword = {
                    location: userLocation,
                    radius: 50000,
                    keyword: 'art fair',
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
                        // fetch by keyword and merge
                        service.nearbySearch(requestKeyword, (resultsKeyword, statusKeyword) => {
                            if (statusKeyword === window.google.maps.places.PlacesServiceStatus.OK && resultsKeyword.length > 0) {
                                //merge all results, removing duplicates by place_id
                                const merged = [...allResults, ...resultsKeyword].reduce((acc, place) => {
                                    if (!acc.some(p => p.place_id === place.place_id)) {
                                        acc.push(place);
                                    }
                                    return acc;
                                }, []);
                                setPlaces(merged);
                            } else {
                                //merge galleries and museums only
                                const merged = allResults.reduce((acc, place) => {
                                    if (!acc.some(p => p.place_id === place.place_id)) {
                                        acc.push(place);
                                    }
                                    return acc;
                                }, []);
                                setPlaces(merged);
                            }
                            setTimeout(() => {
                                setLoading(false);
                            }, 3000); //add 3 second delay before hiding loading

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

    // recommendation algorithm: score and sort after places are loaded
    useEffect(() => {
        if (places.length === 0) return;

        const DISTANCE_WEIGHT = 0.3;
        const PRICE_WEIGHT = 0.25;
        const RATING_WEIGHT = 0.2;
        const TYPE_WEIGHT = 0.2; 

        const maxDistance = 50000; 
        const maxPrice = 4;
        const maxRating = 5;

        //get favorite place IDs from localStorage
        const favorites = JSON.parse(localStorage.getItem('artBase_favorites') || '[]');
        //get viewed place IDs from localStorage
        const interactions = JSON.parse(localStorage.getItem('artBase_userInteractions') || '{}');
        const viewedIds = Object.keys(interactions);
        // count types in both favorited and viewed places, with favorited counting double
        const typeCounts = {};
        // count favorited places (weight = 2)
        favorites.forEach(id => {
            const place = places.find(p => p.place_id === id);
            if (place && place.types) {
                place.types.forEach(type => {
                    if (type === 'art_gallery' || type === 'museum') {
                        typeCounts[type] = (typeCounts[type] || 0) + 2;
                    }
                });
            }
        });
        // count viewed places (weight = 1, but don't double-count favorites)
        viewedIds.forEach(id => {
            if (favorites.includes(id)) return; // already counted as favorite
            const place = places.find(p => p.place_id === id);
            if (place && place.types) {
                place.types.forEach(type => {
                    if (type === 'art_gallery' || type === 'museum') {
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    }
                });
            }
        });
        // calculate total normalization
        const totalTypeCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

        const scoredPlaces = places.map(place => {
            const distance = place.geometry.location ? 
                calculateDistance(userLocation, place.geometry.location) : maxDistance;
            const distanceScore = 1 - (distance / maxDistance);
            const priceScore = place.price_level !== undefined ? (1 - (place.price_level / maxPrice)) : 0.5;
            const ratingScore = place.rating !== undefined ? (place.rating / maxRating) : 0.3;
            // type score: proportional to how often this type appears in favorites or views
            let typeScore = 0;
            if (place.types) {
                typeScore = place.types.reduce((acc, type) => {
                    if (typeCounts[type] && totalTypeCount > 0) {
                        return acc + typeCounts[type] / totalTypeCount;
                    }
                    return acc;
                }, 0);
                typeScore = Math.min(typeScore, 1.0);
            }
            const rankScore =
                DISTANCE_WEIGHT * distanceScore +
                PRICE_WEIGHT * priceScore +
                RATING_WEIGHT * ratingScore +
                TYPE_WEIGHT * typeScore;
            return { ...place, rankScore };
        });
        const sortedPlaces = scoredPlaces.sort((a, b) => b.rankScore - a.rankScore);
        setRecommendedPlaces(sortedPlaces);
    }, [places]);

    //filter by search input
    const filteredPlaces = recommendedPlaces.filter(place =>
        place.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        (place.vicinity && place.vicinity.toLowerCase().includes(searchInput.toLowerCase()))
    );

    return (
        <div className='main-page-container'>
            <Header searchInput={searchInput} setSearchInput={setSearchInput} />
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
                    <div className="loading-container">
                        <h2>Loading...</h2>
                        <p>Finding the best art galleries for you</p>
                    </div>
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