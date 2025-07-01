import React from 'react'

function Card({name, location, image}) {
    return (
        <div className='card'>
            <h2>{name || 'Gallery Name'}</h2>
            <p>{location || 'Location'}</p>
            <img src={image || "/public/gallery-placeholder.png"} alt="Art Gallery" style={{width: "100%"}} />
        </div>
    );
}

export default Card;