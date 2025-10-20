import { Menu } from 'lucide-react';
import Logo from './Logo';
import './Header.css';

export default function Header({ onMenuClick, rightContent }) {
  return (
    <header className="header">
      <div className="header-container">
        <Logo />
        
        <div className="header-actions">
          {rightContent}
          
          <button 
            onClick={onMenuClick}
            className="header-menu-btn"
            aria-label="Открыть меню"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
