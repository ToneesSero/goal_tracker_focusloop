import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ListFilter,
  Plus,
  TrendingUp,
  Grid3X3,
  Rows,
} from 'lucide-react';
import Header from '../components/Header';
import Drawer from '../components/Drawer';
import Button from '../components/Button';
import GoalCard from '../components/GoalCard';
import GoalHistoryDrawer from '../components/GoalHistoryDrawer';
import { goalsService } from '../services/goals.service';
import { authService } from '../services/auth.service';
import './AllGoalsPage.css';

const SUGGESTED_COLORS = [
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
];

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

export default function AllGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [hex, setHex] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('deadline_asc');
  const [view, setView] = useState('grid');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsService.getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
      if (err.response?.status === 401) {
        authService.logout();
        window.location.href = '/auth';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (goalId, update) => {
    try {
      if (update.complete) {
        await goalsService.completeGoal(goalId);
      } else if (update.delta !== undefined) {
        await goalsService.updateProgress(goalId, update.delta);
      }
      await loadGoals();
    } catch (err) {
      console.error('Failed to update goal:', err);
      if (err.response?.status === 401) {
        authService.logout();
        window.location.href = '/auth';
      }
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await goalsService.deleteGoal(goalId);
      await loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
      if (err.response?.status === 401) {
        authService.logout();
        window.location.href = '/auth';
      }
    }
  };

  const handleOpenHistory = async (goal) => {
    try {
      setSelectedGoal(goal);
      const historyData = await goalsService.getHistory(goal.id);
      setHistory(historyData);
      setHistoryOpen(true);
    } catch (err) {
      console.error('Failed to load history:', err);
      if (err.response?.status === 401) {
        authService.logout();
        window.location.href = '/auth';
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  function toggleColor(c) {
    setSelectedColors((arr) =>
      arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]
    );
  }

  const filtered = useMemo(() => {
    let res = goals.slice();

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      res = res.filter((g) => g.name.toLowerCase().includes(qq));
    }

    if (selectedColors.length) {
      res = res.filter((g) => selectedColors.includes(g.color.toUpperCase()));
    }

    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) {
      const hx = hex.toUpperCase();
      res = res.filter((g) => g.color.toUpperCase() === hx);
    }

    res = res.filter((g) => {
      const p = pct(g.current, g.target);
      const d = daysLeft(g.deadline);
      if (status === 'completed') return p >= 100;
      if (status === 'overdue')
        return typeof d === 'number' && d < 0 && p < 100;
      if (status === 'active')
        return p < 100 && (typeof d !== 'number' || d >= 0);
      return true;
    });

    res.sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'progress_desc')
        return pct(b.current, b.target) - pct(a.current, a.target);
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (sort === 'deadline_asc') return da - db;
      if (sort === 'deadline_desc') return db - da;
      return 0;
    });

    return res;
  }, [goals, q, selectedColors, hex, status, sort]);

  const metrics = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => pct(g.current, g.target) >= 100).length;
    const overdue = goals.filter((g) => {
      const p = pct(g.current, g.target);
      const d = daysLeft(g.deadline);
      return typeof d === 'number' && d < 0 && p < 100;
    }).length;
    const avg = total
      ? Math.round(
          goals.reduce((s, g) => s + pct(g.current, g.target), 0) / total
        )
      : 0;
    return { total, completed, overdue, avg };
  }, [goals]);

  return (
    <div className="all-goals-page">
      <Header
        onMenuClick={() => setDrawerOpen(true)}
        rightContent={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => (window.location.href = '/create')}
          >
            Новая цель
          </Button>
        }
      />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <nav className="all-goals-nav">
          <a href="/goals" className="all-goals-nav-item">
            Цели
          </a>
          <a href="/stats" className="all-goals-nav-item">
            Статистика
          </a>
          <div className="all-goals-nav-divider" />
          <button onClick={handleLogout} className="all-goals-nav-item">
            Выйти
          </button>
        </nav>
      </Drawer>

      <main className="all-goals-main">
        <div className="all-goals-controls">
          <div className="all-goals-controls-left">
            <label className="all-goals-search">
              <Search size={16} />
              <input
                placeholder="Поиск по названию"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <div className="all-goals-color-filters">
              <span className="all-goals-filter-label">
                <Filter size={16} /> Цвет:
              </span>
              {SUGGESTED_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleColor(c)}
                  className={`all-goals-color-chip ${
                    selectedColors.includes(c) ? 'active' : ''
                  }`}
                  aria-label={`Фильтр по цвету ${c}`}
                >
                  <span
                    className="all-goals-color-chip-dot"
                    style={{ backgroundColor: c }}
                  />
                  <span style={{ color: c }}>{c}</span>
                </button>
              ))}

              <label className="all-goals-hex-input">
                <ListFilter size={16} />
                <input
                  placeholder="#RRGGBB"
                  value={hex}
                  onChange={(e) => setHex(e.target.value.toUpperCase())}
                />
                <input
                  type="color"
                  value={/^#([0-9A-Fa-f]{6})$/.test(hex) ? hex : '#FFFFFF'}
                  onChange={(e) => setHex(e.target.value.toUpperCase())}
                />
              </label>

              <button
                onClick={() => {
                  setHex('');
                  setSelectedColors([]);
                  setQ('');
                  setStatus('all');
                  setSort('deadline_asc');
                }}
                className="all-goals-reset-btn"
              >
                Сбросить
              </button>
            </div>
          </div>

          <div className="all-goals-controls-right">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="all-goals-select"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="completed">Завершённые</option>
              <option value="overdue">Просроченные</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="all-goals-select"
            >
              <option value="deadline_asc">Сначала ближайшие</option>
              <option value="deadline_desc">Сначала дальние</option>
              <option value="progress_desc">По прогрессу</option>
              <option value="name_asc">По алфавиту</option>
            </select>

            <div className="all-goals-view-toggle">
              <button
                onClick={() => setView('grid')}
                className={view === 'grid' ? 'active' : ''}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setView('list')}
                className={view === 'list' ? 'active' : ''}
              >
                <Rows size={20} />
              </button>
            </div>
          </div>
        </div>

        <section className="all-goals-metrics">
          <div className="metric-card">
            <div className="metric-label">Всего целей</div>
            <div className="metric-value">{metrics.total}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Завершено</div>
            <div className="metric-value metric-success">{metrics.completed}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Просрочено</div>
            <div className="metric-value metric-danger">{metrics.overdue}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Средний прогресс</div>
            <div className="metric-value metric-with-icon">
              {metrics.avg}% <TrendingUp size={20} />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="all-goals-loading">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="all-goals-empty">
            Ничего не найдено. Попробуйте изменить фильтры или запрос.
          </div>
        ) : view === 'grid' ? (
          <section className="all-goals-grid">
            {filtered.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onUpdate={handleUpdateGoal}
                onOpenHistory={handleOpenHistory}
                onDelete={handleDeleteGoal}
              />
            ))}
          </section>
        ) : (
          <section className="all-goals-list">
            {filtered.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onUpdate={handleUpdateGoal}
                onOpenHistory={handleOpenHistory}
                onDelete={handleDeleteGoal}
              />
            ))}
          </section>
        )}
      </main>

      <footer className="all-goals-footer">
        <div className="all-goals-footer-container">
          <p>© {new Date().getFullYear()} focusloop</p>
          <div>UI: технологический минимализм • Primary: Cyan</div>
        </div>
      </footer>

      <GoalHistoryDrawer
        goal={selectedGoal}
        history={history}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
