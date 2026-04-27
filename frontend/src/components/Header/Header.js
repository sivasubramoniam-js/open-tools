import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Github, Image as ImageIcon, Home } from 'lucide-react';
import './Header.css';

function Header({ theme, toggleTheme }) {
  const location = useLocation();
  
  return (
    <nav className="v2-nav common-header">
      <Link to="/" className="v2-logo" style={{ textDecoration: 'none' }}>
        OPEN TOOLS <span className="version-pill">V2.0</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={18} /> HomeHub
        </Link>
        <Link to="/image-tools" className={`nav-link ${location.pathname === '/image-tools' ? 'active' : ''}`}>
          <ImageIcon size={18} /> ImageStudio
        </Link>
      </div>

      <div className="nav-actions">
        <a href="https://github.com" className="header-icon-btn">
          <Github size={20} />
        </a>
        <button onClick={toggleTheme} className="header-icon-btn">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
}

export default Header;
