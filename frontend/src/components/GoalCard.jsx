import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
  X,
  Clock,
  Trash
} from 'lucide-react';
import Donut from './Donut';
import Button from './Button';
import './GoalCard.css';

function pct(current, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function daysLeft(dateISO) {
  if (!dateISO) return undefined;
  const now = new Date();
  const end = new Date(`${dateISO}T23:59:59`);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

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

export default function GoalCard({ goal, onUpdate, onOpenHistory, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [delta, setDelta] = useState('');
  const [loading, setLoading] = useState(false);

  const value = pct(goal.current, goal.target);
  const dleft = daysLeft(goal.deadline);
  const gradient = getGradient(goal.color);

  const handleUpdateProgress = async () => {
    const d = Number(delta);
    if (Number.isNaN(d) || d === 0) return;

    setLoading(true);
    try {
      await onUpdate(goal.id, { delta: d });
      setDelta('');
      setEdit(false);
    } catch (err) {
      console.error('Failed to update progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onUpdate(goal.id, { complete: true });
    } catch (err) {
      console.error('Failed to complete goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить цель? Это действие необратимо.')) return;
    setLoading(true);
    try {
      await onDelete(goal.id);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = value >= 100 ? (
    <span className="goal-badge goal-badge-success">
      <CheckCircle2 size={16} /> Завершено
    </span>
  ) : typeof dleft === 'number' && dleft < 0 ? (
    <span className="goal-badge goal-badge-danger">
      <AlertTriangle size={16} /> Просрочено
    </span>
  ) : typeof dleft === 'number' && dleft <= 7 ? (
    <span className="goal-badge goal-badge-warning">Осталось: {dleft} дн.</span>
  ) : (
    <span className="goal-badge goal-badge-neutral">
      {typeof dleft === 'number' ? `Осталось: ${dleft} дн.` : 'Без дедлайна'}
    </span>
  );

  return (
    <div className="goal-card">
      <div className="goal-card-gradient" style={{ background: gradient }} />

      <div className="goal-card-content">
        <div className="goal-card-header">
          <div className="goal-card-info">
            <div
              className="goal-card-color-badge"
              style={{ borderColor: goal.color, color: goal.color }}
            >
              <span className="goal-card-color-dot" style={{ backgroundColor: goal.color }} />
              {goal.color}
            </div>

            <h3 className="goal-card-title">{goal.name}</h3>

            <div className="goal-card-target">
              Цель: {goal.target} {goal.unit}
            </div>

            {goal.deadline && (
              <div className="goal-card-deadline">
                <Calendar size={16} />
                Дедлайн: {goal.deadline}
                {statusBadge}
              </div>
            )}
          </div>

          <Donut value={value} color={goal.color} />
        </div>

        <div className="goal-progress-bar">
          <motion.div
            className="goal-progress-fill"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <div className="goal-card-actions">
          {!edit ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit3 size={16} />}
              onClick={() => setEdit(true)}
              disabled={loading}
            >
              Обновить прогресс
            </Button>
          ) : (
            <div className="goal-edit-form">
              <input
                type="number"
                step="0.01"
                placeholder="+0"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="goal-edit-input"
                disabled={loading}
              />
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={16} />}
                onClick={handleUpdateProgress}
                disabled={loading}
              >
                Сохранить
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<X size={16} />}
                onClick={() => {
                  setDelta('');
                  setEdit(false);
                }}
                disabled={loading}
              >
                Отмена
              </Button>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCircle2 size={16} />}
            onClick={handleComplete}
            disabled={loading || value >= 100}
            className="goal-complete-btn"
          >
            Отметить как выполнено
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Clock size={16} />}
            onClick={() => onOpenHistory(goal)}
            disabled={loading}
          >
            История
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Trash size={16} />}
            onClick={handleDelete}
            disabled={loading}
            className="goal-delete-btn"
          >
            Удалить
          </Button>
        </div>

        <div className="goal-card-progress-text">
          Прогресс: {goal.current} / {goal.target} {goal.unit} ({value}%)
        </div>
      </div>
    </div>
  );
}
