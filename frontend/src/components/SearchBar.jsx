import { useState } from 'react';

export default function SearchBar({ searchInput, setSearchInput }) {
    // handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
    }

    // handles clear
    const handleClear = () => {
        setSearchInput('');
    }

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit} className="search-form">
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search for galleries, museums, fairs..."
                    className="search-input"
                />
                <button type="submit" className="search-button">
                    Search
                </button>
                <button type="button" onClick={handleClear}>
                    Clear
                </button>
            </form>
        </div>
    )
}
