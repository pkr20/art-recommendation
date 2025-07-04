import React from 'react'
import {useNavigate} from 'react-router-dom'

function Card({name, location, image, placeId, place}) {
    const navigate = useNavigate();

    //when  clicking on the card, navigates to a new page
    const handleClick = () => {
        if (placeId) {
            navigate(`/place/${placeId}`, {state: {place}});
        }
    };


    return (
        <div className='card' onClick={handleClick}>
            <h2>{name || 'Gallery Name'}</h2>
            <p>{location || 'Location'}</p>
            <img src={image || "/public/gallery-placeholder.png"} alt="Art Gallery" style={{width: "100%"}} />
        </div>
    );
}

export default Card;