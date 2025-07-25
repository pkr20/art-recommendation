import React, { useEffect, useState } from 'react';
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
import { checkSession } from './utils/sessionApi';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchSession() {
      const session = await checkSession();
      if (session.loggedIn) {
        setUser({ userId: session.userId });
      } else {
        setUser(null);
      }
    }
    fetchSession();
  }, []);

  return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/main" element={<MainPage user={user} setUser={setUser} />} />
        <Route path='/place/:placeId' element={<PlacePage user={user} setUser={setUser}/>} />
        <Route path="/favorites" element={<FavoritesPage user={user} setUser={setUser} />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
        <Route path="/recommended" element={<RecommendedPage user={user} setUser={setUser} />} />
        <Route path="/events" element={<EventPage user={user} setUser={setUser} />}/>
      </Routes>
  );
}

export default App;
