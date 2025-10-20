import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Hash,
  Target,
  Palette,
  Activity,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import Donut from '../components/Donut';
import { goalsService } from '../services/goals.service';
import { authService } from '../services/auth.service';
import './CreateGoalPage.css';

const SUGGESTED_COLORS = [
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
];

function isValidHex(color) {
  return /^#([0-9A-Fa-f]{6})$/.test(color);
}

function differenceInDays(dateISO) {
  if (!dateISO) return undefined;
  const now = new Date();
  const end = new Date(`${dateISO}T23:59:59`);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function GoalPreview({ name, unit, current, target, deadline, color }) {
  const pct = useMemo(() => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  }, [current, target]);

  const daysLeft = differenceInDays(deadline || '');

  return (
    <div className="goal-preview-card">
      <div className="goal-preview-header">
        <div className="goal-preview-info">
          <div
            className="goal-preview-badge"
            style={{ borderColor: color, color }}
          >
            <span
              className="goal-preview-dot"
              style={{ backgroundColor: color }}
            />
            {color}
          </div>
          <h3 className="goal-preview-title">{name || 'Новая цель'}</h3>
          <div className="goal-preview-target">
            Цель: {target || 0} {unit || 'ед.'}
          </div>
          {deadline && (
            <div className="goal-preview-deadline">
              <Calendar size={16} />
              Дедлайн: {deadline}
              {typeof daysLeft === 'number' && (
                <span
                  className={`goal-preview-days ${
                    daysLeft < 0
                      ? 'overdue'
                      : daysLeft <= 7
                      ? 'warning'
                      : 'normal'
                  }`}
                >
                  {daysLeft < 0 ? 'Просрочено' : `Осталось: ${daysLeft} дн.`}
                </span>
              )}
            </div>
          )}
        </div>

        <Donut value={pct} color={color} size={140} />
      </div>

      <div className="goal-preview-bar">
        <motion.div
          className="goal-preview-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="goal-preview-status">
        {pct >= 100 ? (
          <span className="goal-preview-complete">
            <CheckCircle2 size={16} />
            Цель достигнута
          </span>
        ) : (
          <span>
            Прогресс: {current || 0} / {target || 0} {unit || 'ед.'} ({pct}%)
          </span>
        )}
      </div>
    </div>
  );
}

export default function CreateGoalPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('%');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#06B6D4');
  const [current, setCurrent] = useState('0');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [todayISO, setTodayISO] = useState('');

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setTodayISO(`${year}-${month}-${day}`);
  }, []);

  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = 'Укажите название цели';
    const tValue = Number(target);
    if (!target || Number.isNaN(tValue) || tValue <= 0) {
      e.target = 'Введите положительное число';
    }
    if (!unit.trim()) e.unit = 'Укажите единицу измерения';
    if (!deadline) {
      e.deadline = 'Выберите дату';
    } else {
      const diff = differenceInDays(deadline);
      if (typeof diff === 'number' && diff < 0) {
        e.deadline = 'Дата не может быть в прошлом';
      }
    }
    if (!isValidHex(color)) e.color = 'Некорректный HEX‑цвет';
    return e;
  }, [name, target, unit, deadline, color]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.keys(errors).length) {
      setTouched({
        name: true,
        unit: true,
        target: true,
        deadline: true,
        color: true,
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      await goalsService.createGoal({
        name,
        unit,
        target: Number(target),
        deadline,
        color,
      });
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось создать цель');
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-goal-page">
      <Header
        onMenuClick={() => {}}
        rightContent={
          <a href="/goals" className="create-goal-back">
            <ArrowLeft size={16} /> К списку целей
          </a>
        }
      />

      <main className="create-goal-main">
        <section className="create-goal-form-section">
          <div className="create-goal-form-card">
            <div className="create-goal-badge">
              <Activity size={14} /> Новая цель
            </div>
            <h1 className="create-goal-title">Создать цель</h1>
            <p className="create-goal-subtitle">
              Заполните параметры и посмотрите живой предпросмотр справа.
            </p>

            {error && (
              <div className="create-goal-error">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="create-goal-form">
              <div className="create-goal-row">
                <Input
                  label="Название цели"
                  type="text"
                  name="name"
                  placeholder="Например: Пробежать марафон"
                  value={name}
                  onChange={setName}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  error={touched.name ? errors.name : ''}
                  required
                />

                <Input
                  label="Единица измерения"
                  type="text"
                  name="unit"
                  placeholder="км, страницы, ч, кг, % ..."
                  value={unit}
                  onChange={setUnit}
                  onBlur={() => setTouched((prev) => ({ ...prev, unit: true }))}
                  error={touched.unit ? errors.unit : ''}
                  required
                />
              </div>

              <div className="create-goal-row">
                <Input
                  label="Итоговое значение"
                  type="number"
                  name="target"
                  placeholder="Например: 42"
                  leftIcon={<Target size={20} />}
                  value={target}
                  onChange={setTarget}
                  onBlur={() => setTouched((prev) => ({ ...prev, target: true }))}
                  error={touched.target ? errors.target : ''}
                  required
                />

                <Input
                  label="Дедлайн"
                  type="date"
                  name="deadline"
                  min={todayISO}
                  leftIcon={<Calendar size={20} />}
                  value={deadline}
                  onChange={setDeadline}
                  onBlur={() => setTouched((prev) => ({ ...prev, deadline: true }))}
                  error={touched.deadline ? errors.deadline : ''}
                  required
                />
              </div>

              <div className="create-goal-color-section">
                <label className="create-goal-label">Цвет цели</label>

                <div className="create-goal-color-grid">
                  <div className="create-goal-hex-picker">
                    <div className="create-goal-hex-input">
                      <Palette size={20} />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value.toUpperCase())}
                        onBlur={() => setTouched((prev) => ({ ...prev, color: true }))}
                        placeholder="#06B6D4"
                      />
                      <input
                        type="color"
                        value={isValidHex(color) ? color : '#06B6D4'}
                        onChange={(e) => setColor(e.target.value.toUpperCase())}
                      />
                    </div>
                    {touched.color && errors.color && (
                      <div className="create-goal-field-error">
                        <AlertTriangle size={14} />
                        {errors.color}
                      </div>
                    )}
                    <div className="create-goal-hint">
                      <Info size={14} />
                      Можно ввести любой HEX‑цвет или выбрать на пипетке
                    </div>
                  </div>

                  <div className="create-goal-color-palette">
                    {SUGGESTED_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`create-goal-color-btn ${
                          color === c ? 'active' : ''
                        }`}
                      >
                        <span
                          className="create-goal-color-swatch"
                          style={{ backgroundColor: c }}
                        />
                        <span style={{ color: c }}>{c}</span>
                      </button>
                    ))}
                    <div className="create-goal-hint">
                      <Info size={14} />
                      Подборка оттенков, гармонирующих с интерфейсом
                    </div>
                  </div>
                </div>
              </div>

              <div className="create-goal-preview-input">
                <label className="create-goal-label">
                  Текущее значение (для предпросмотра)
                </label>
                <Input
                  type="number"
                  name="current"
                  placeholder="0"
                  leftIcon={<Hash size={20} />}
                  value={current}
                  onChange={setCurrent}
                />
                <div className="create-goal-hint">
                  <Info size={14} />
                  Это не обязательно — только для визуального превью диаграммы и карточки
                </div>
              </div>

              <div className="create-goal-submit">
                <div className="create-goal-disclaimer">
                  Нажимая «Сохранить», вы подтверждаете согласие с Условиями и Политикой.
                </div>
                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="create-goal-preview-section-right">
          <div className="create-goal-preview-card-wrapper">
            <h2 className="create-goal-preview-title">Предпросмотр карточки</h2>
            <p className="create-goal-preview-text">
              Круговая диаграмма и оформление обновляются по мере изменения полей слева.
            </p>

            <GoalPreview
              name={name}
              unit={unit}
              current={Number(current) || 0}
              target={Number(target) || 0}
              deadline={deadline}
              color={isValidHex(color) ? color : '#CBD5E1'}
            />
          </div>

          <div className="create-goal-tips">
            <div className="create-goal-tips-icon">
              <Info size={20} />
            </div>
            <div>
              <div className="create-goal-tips-title">Советы по цвету</div>
              <ul className="create-goal-tips-list">
                <li>
                  Яркие оттенки (#06B6D4, #3B82F6, #8B5CF6, #10B981, #F59E0B, #EC4899) хорошо сочетаются с интерфейсом.
                </li>
                <li>
                  Для лучшей читаемости избегайте слишком тёмных цветов на тёмном фоне.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="create-goal-footer">
        <div className="create-goal-footer-container">
          <p>© {new Date().getFullYear()} focusloop</p>
          <div className="create-goal-footer-links">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
