import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SignIn from './SignIn';
import MainPage from './MainPage';

function App() {
  return (
   
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/" element={<SignIn />} />
      </Routes>

  );
}

export default App;
