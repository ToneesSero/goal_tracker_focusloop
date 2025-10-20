import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Trophy,
  Flag,
  BarChart3,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  Target,
  TrendingUp,
} from 'lucide-react';
import Header from '../components/Header';
import Drawer from '../components/Drawer';
import Donut from '../components/Donut';
import { statsService } from '../services/stats.service';
import { authService } from '../services/auth.service';
import './UserStatsPage.css';

function ActivitySparkline({ series }) {
  const len = series.length || 1;
  const W = 100;
  const H = 48;
  const bw = W / len;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="activity-sparkline">
      <rect x="0" y="0" width={W} height={H} fill="#F1F5F9" />
      {series.map((p, i) => {
        const x = i * bw;
        const barH = p.value ? H : 0;
        const y = H - barH;
        const gap = Math.min(0.5, bw * 0.15);
        return (
          <rect
            key={p.date}
            x={x + gap}
            y={y}
            width={Math.max(0, bw - gap * 2)}
            height={barH}
            fill="#06B6D4"
            opacity={p.value ? 1 : 0}
          />
        );
      })}
    </svg>
  );
}

function KpiTile({ title, value, icon }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile-label">{title}</div>
      <div className="kpi-tile-value">
        {icon}
        {value}
      </div>
    </div>
  );
}

export default function UserStatsPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, statsData] = await Promise.all([
        authService.getCurrentUser(),
        statsService.getUserStats(Number(period)),
      ]);
      setUser(userData);
      setStats((prev) => ({
        ...statsData,
        fastest_goal:
          statsData.fastest_goal !== null
            ? statsData.fastest_goal
            : prev?.fastest_goal ?? null,
        streaks:
          statsData.streaks !== null ? statsData.streaks : prev?.streaks ?? { current: 0, longest: 0 },
      }));
    } catch (err) {
      console.error('Failed to load stats:', err);
      if (err.response?.status === 401) {
        authService.logout();
        window.location.href = '/auth';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  const activeDays = useMemo(() => {
    if (!stats?.activity_series) return 0;
    return stats.activity_series.filter((p) => p.value === 1).length;
  }, [stats]);

  if (loading || !user || !stats) {
    return (
      <div className="user-stats-page">
        <Header onMenuClick={() => setDrawerOpen(true)} />
        <main className="user-stats-main">
          <div className="user-stats-loading">Загрузка статистики...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="user-stats-page">
      <Header onMenuClick={() => setDrawerOpen(true)} />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <nav className="user-stats-nav">
          <a href="/goals" className="user-stats-nav-item">
            Цели
          </a>
          <a href="/stats" className="user-stats-nav-item">
            Статистика
          </a>
          <div className="user-stats-nav-divider" />
          <button onClick={handleLogout} className="user-stats-nav-item">
            Выйти
          </button>
        </nav>
      </Drawer>

      <main className="user-stats-main">
        <section className="user-card">
          <div className="user-card-icon">
            <UserIcon size={24} />
          </div>
          <div className="user-card-info">
            <div className="user-card-label">Профиль</div>
            <div className="user-card-name">{user.name}</div>
            <div className="user-card-email">{user.email}</div>
          </div>
        </section>

        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Всего целей</div>
            <div className="kpi-value">
              <Target size={20} /> {stats.total}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Завершено</div>
            <div className="kpi-value">
              <CheckCircle2 size={20} /> {stats.completed}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Процент выполнения</div>
            <div className="kpi-donut">
              <Donut value={stats.rate} color="#06B6D4" size={132} />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-label">Активность (посл. {period} дн.)</div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="kpi-select"
              >
                <option value="14">14</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>
            <div className="kpi-activity">
              <ActivitySparkline series={stats.activity_series} />
            </div>
            <div className="kpi-activity-text">
              Активные дни: {activeDays}/{stats.activity_series.length}
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="stats-card"
          >
            <div className="stats-card-header">
              <Trophy size={16} />
              Самая быстрая цель
            </div>
            {stats.fastest_goal ? (
              <div className="stats-card-content">
                <div className="fastest-goal-name">
                  {stats.fastest_goal.name}
                </div>
                <div className="fastest-goal-time">
                  <Clock size={16} />
                  За {stats.fastest_goal.days} дн. (с {stats.fastest_goal.created_at} по {stats.fastest_goal.completed_at})
                </div>
                <div
                  className="fastest-goal-bar"
                  style={{
                    background: `linear-gradient(135deg, ${stats.fastest_goal.color} 0%, #ffffff 100%)`,
                  }}
                />
              </div>
            ) : (
              <div className="stats-card-empty">
                Пока нет завершённых целей.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="stats-card"
          >
            <div className="stats-card-header">
              <Flame size={16} />
              Стрики
            </div>
            <div className="streaks-grid">
              <div className="streak-card">
                <div className="streak-label">Текущий стрик</div>
                <div className="streak-value">
                  <Calendar size={20} /> {stats.streaks.current} дн.
                </div>
              </div>
              <div className="streak-card">
                <div className="streak-label">Максимальный стрик</div>
                <div className="streak-value">
                  <Flag size={20} /> {stats.streaks.longest} дн.
                </div>
              </div>
            </div>
            <div className="streaks-note">
              Стрик растёт, если есть хотя бы одно действие в день (обновление прогресса, отметка выполнения и т.д.).
            </div>
          </motion.div>
        </section>

        <section className="additional-metrics">
          <div className="additional-metrics-header">
            <BarChart3 size={16} />
            Ещё метрики
          </div>
          <div className="additional-metrics-grid">
            <KpiTile
              title="Среднее время завершения"
              value={`${stats.avg_days_to_complete} дн.`}
              icon={<Clock size={20} />}
            />
            <KpiTile
              title="Доля активных целей"
              value={`${stats.active_rate}%`}
              icon={<TrendingUp size={20} />}
            />
            <KpiTile
              title="Завершённых за месяц"
              value={`${stats.completed_in_last_30_days}`}
              icon={<CheckCircle2 size={20} />}
            />
          </div>
        </section>
      </main>

      <footer className="user-stats-footer">
        <div className="user-stats-footer-container">
          <p>© {new Date().getFullYear()} focusloop</p>
          <div>UI: технологический минимализм • Primary: Cyan</div>
        </div>
      </footer>
    </div>
  );
}
