import React from 'react';
import 'animate.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SignIn from './components/SignIn';
import MainPage from './components/MainPage';
import PlacePage from './components/PlacePage';
import FavoritesPage from './components/FavoritesPage';
import Profile from './components/Profile';
import RecommendedPage from './components/RecommendedPage';
import EventPage from './components/EventPage';


function App() {
  return (

   
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/main" element={<MainPage />} />
        <Route path='/place/:placeId' element={<PlacePage/>} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommended" element={<RecommendedPage />} />
        <Route path="/events" element={<EventPage />}/>
        
        

      </Routes>

  );
}

export default App;
