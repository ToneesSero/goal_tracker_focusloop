import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import './GoalHistoryDrawer.css';

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const bigint = parseInt(m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function lighten(hex, amt = 0) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * amt));
  const ng = Math.min(255, Math.round(g + (255 - g) * amt));
  const nb = Math.min(255, Math.round(b + (255 - b) * amt));
  return `#${[nr, ng, nb].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function darken(hex, amt = 0) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.round(r * (1 - amt)));
  const ng = Math.max(0, Math.round(g * (1 - amt)));
  const nb = Math.max(0, Math.round(b * (1 - amt)));
  return `#${[nr, ng, nb].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function getGradient(hex) {
  const from = darken(hex, 0.1);
  const to = lighten(hex, 0.35);
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

function fmt(n) {
  const s = String(n);
  if (s.includes('.')) return parseFloat(Number(n).toFixed(2)).toString();
  return s;
}

export default function GoalHistoryDrawer({ goal, history, isOpen, onClose }) {
  const gradient = goal ? getGradient(goal.color) : '';

  const lastUpdate = useMemo(() => {
    if (!history?.rows?.length) return '—';
    return history.rows[history.rows.length - 1].date;
  }, [history]);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) {
      window.addEventListener('keydown', onEsc);
    }
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!goal) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="history-drawer-overlay">
          <motion.div
            className="history-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="history-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="history-drawer-header">
              <div className="history-drawer-title-block">
                <div
                  className="history-drawer-color-badge"
                  style={{ borderColor: goal.color, color: goal.color }}
                >
                  <span
                    className="history-drawer-color-dot"
                    style={{ backgroundColor: goal.color }}
                  />
                  {goal.color}
                </div>
                <h2 className="history-drawer-title">{goal.name}</h2>
                <div className="history-drawer-subtitle">
                  Цель: {fmt(goal.target)} {goal.unit}
                </div>
              </div>
              <button onClick={onClose} className="history-drawer-close">
                <X size={20} />
              </button>
            </div>

            <div className="history-drawer-strip" style={{ background: gradient }} />

            <div className="history-drawer-summary">
              <div className="history-summary-card">
                <div className="history-summary-label">Начальное значение</div>
                <div className="history-summary-value">
                  {fmt(history?.initial || 0)} {goal.unit}
                </div>
              </div>
              <div className="history-summary-card">
                <div className="history-summary-label">Всего обновлений</div>
                <div className="history-summary-value">{history?.rows?.length || 0}</div>
              </div>
              <div className="history-summary-card">
                <div className="history-summary-label">Последнее обновление</div>
                <div className="history-summary-value">{lastUpdate}</div>
              </div>
            </div>

            <div className="history-drawer-timeline">
              {history?.rows?.length ? (
                <ul className="history-timeline-list">
                  {history.rows.map((row, index) => (
                    <li key={index} className="history-timeline-item">
                      <div className="history-timeline-header">
                        <div className="history-timeline-date">
                          <Calendar size={16} />
                          <span>{row.date}</span>
                        </div>
                        <div className="history-timeline-delta">
                          <span style={{ color: goal.color }}>
                            {row.delta > 0 ? '+' : ''}
                            {fmt(row.delta)} {goal.unit}
                          </span>
                        </div>
                      </div>
                      <div className="history-timeline-after">
                        После: <span>{fmt(row.after)}</span> / {fmt(goal.target)} {goal.unit} ({row.pct}%)
                      </div>
                      {row.note && <div className="history-timeline-note">Заметка: {row.note}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="history-empty">
                  История пустая. Обновите прогресс, чтобы увидеть события.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
