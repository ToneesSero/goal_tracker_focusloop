import { Sparkles } from 'lucide-react';
import './Logo.css';

export default function Logo() {
  return (
    <a href="/" className="logo">
      <span className="logo-icon">
        <Sparkles size={16} />
      </span>
      <span className="logo-text">focusloop</span>
    </a>
  );
}
