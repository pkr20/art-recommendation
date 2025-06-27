import React from 'react'

function Card() {
    return (
        <div className='card'>
            <h2>Gallery Name</h2>
            <p>Location</p>
            <img src="/public/gallery-placeholder.png" alt="Art Gallery" style={{width: "100%"}} />
        </div>
    );
}

export default Card;