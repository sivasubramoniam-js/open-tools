import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import V2Page from './pages/v2/V2Page';
import ImageToolsPage from './pages/image-tools/ImageToolsPage';
import PdfToolsPage from './pages/pdf-tools/PdfToolsPage';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <div className="app-main-layout">
        <Header theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/image-tools" element={<ImageToolsPage />} />
          <Route path="/pdf-tools" element={<PdfToolsPage />} />
          <Route path="/" element={<V2Page />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
