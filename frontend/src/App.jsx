import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SignIn from './components/SignIn';
import MainPage from './components/MainPage';
import PlacePage from './components/PlacePage';
import FavoritesPage from './components/FavoritesPage';


function App() {
  return (

   
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/main" element={<MainPage />} />
        <Route path='/place/:placeId' element={<PlacePage/>} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/" element={<SignIn />} />
      </Routes>

  );
}

export default App;
