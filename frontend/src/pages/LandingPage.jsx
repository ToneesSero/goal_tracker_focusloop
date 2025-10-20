import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  LogIn,
} from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Drawer from '../components/Drawer';
import { authService } from '../services/auth.service';
import './LandingPage.css';

const navItems = [
  { label: 'Главная', href: '#home' },
  { label: 'Возможности', href: '#features' },
  { label: 'Цены', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Контакты', href: '#contact' },
];

function LandingHeader({ onMenuClick, isAuthenticated }) {
  return (
    <header className="landing-header">
      <div className="landing-header-container">
        <a href={isAuthenticated ? '/goals' : '/'} className="logo-link">
          <Logo />
        </a>

        <div className="landing-header-actions">
          {!isAuthenticated && (
            <a href="/auth" className="landing-signin-link">
              <LogIn size={16} />
              <span>Войти</span>
            </a>
          )}

          <button
            onClick={onMenuClick}
            className="landing-menu-btn"
            aria-label="Открыть меню"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-bg">
        <div className="hero-bg-gradient" />
        <div className="hero-bg-grid" />
      </div>

      <div className="hero-container">
        <div className="hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-content"
          >
            <div className="hero-badge">
              <Sparkles size={12} />
              <span>Технологический минимализм</span>
            </div>

            <h1 className="hero-title">
              Цели. Данные. Результаты — просто и ярко
            </h1>

            <p className="hero-text">
              Создавайте цели, выбирайте цвета и визуализируйте прогресс без
              лишней сложности.
            </p>

            <div className="hero-actions">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => {
                  window.location.href = '/auth';
                }}
              >
                Начать бесплатно
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Посмотреть возможности
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-visual"
          >
            <div className="hero-mockup">
              <div className="hero-mockup-bg" />
              <div className="hero-mockup-content">
                <div className="hero-mockup-sidebar">
                  <div className="hero-mockup-item" />
                  <div className="hero-mockup-item" />
                  <div className="hero-mockup-item" />
                  <div className="hero-mockup-item" />
                </div>
                <div className="hero-mockup-main">
                  <div className="hero-mockup-header" />
                  <div className="hero-mockup-cards">
                    <div className="hero-mockup-card" />
                    <div className="hero-mockup-card" />
                    <div className="hero-mockup-card" />
                  </div>
                  <div className="hero-mockup-big-card" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ValueCards() {
  const items = [
    {
      icon: <ShieldCheck size={20} />,
      title: 'Минимализм без компромиссов',
      text: 'Чистые интерфейсы, понятная иерархия, фокус на задаче.',
    },
    {
      icon: <BarChart3 size={20} />,
      title: 'Гибкая цветовая система',
      text: 'Любые акценты для целей и графиков — без конфликтов с UI.',
    },
    {
      icon: <Sparkles size={20} />,
      title: 'Адаптивно и быстро',
      text: 'От мобильных до десктопа. Микроанимации — по делу.',
    },
  ];

  return (
    <section id="features" className="value-section">
      <div className="value-container">
        <div className="value-grid">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="value-card"
            >
              <div className="value-card-icon">{item.icon}</div>
              <h3 className="value-card-title">{item.title}</h3>
              <p className="value-card-text">{item.text}</p>
              <span className="value-card-accent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturePreview() {
  return (
    <section className="feature-section">
      <div className="feature-container">
        <div className="feature-grid">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="feature-content"
          >
            <h2 className="feature-title">
              Визуализация прогресса без лишнего
            </h2>
            <p className="feature-text">
              Лёгкие карточки, тонкие бордеры и аккуратные тени. Цвета целей
              могут быть любыми — интерфейс всегда останется читабельным и
              аккуратным.
            </p>
            <ul className="feature-list">
              {[
                'Персональные акценты для целей',
                'Чёткая иерархия и интервалы',
                'Тёмная тема по умолчанию поддерживается',
              ].map((text) => (
                <li key={text}>
                  <CheckCircle2 size={20} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="feature-visual"
          >
            <div className="feature-mockup">
              <div className="feature-mockup-grid">
                <div className="feature-mockup-card" />
                <div className="feature-mockup-card" />
                <div className="feature-mockup-card" />
                <div className="feature-mockup-big" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      n: '01',
      t: 'Создайте цель',
      d: 'Определите метрику и желаемый результат.',
    },
    {
      n: '02',
      t: 'Выберите цвет',
      d: 'Установите акцент для наглядности и мотивации.',
    },
    {
      n: '03',
      t: 'Отслеживайте прогресс',
      d: 'Виджеты и графики — всё под рукой.',
    },
  ];

  return (
    <section className="steps-section">
      <div className="steps-container">
        <h2 className="steps-title">Как это работает</h2>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="steps-card"
            >
              <div className="steps-number">{step.n}</div>
              <div className="steps-card-title">{step.t}</div>
              <div className="steps-card-text">{step.d}</div>
              <span className="steps-divider" />
              <span className="steps-accent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="social-section">
      <div className="social-container">
        <div className="social-grid">
          {['alfa', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'].map((key) => (
            <div key={key} className="social-logo" />
          ))}
        </div>
        <div className="sr-only">Логотипы партнёров/клиентов</div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '0 ₽',
      period: 'навсегда',
      features: [
        'До 5 целей',
        'История изменений',
        'Базовая статистика',
      ],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '399 ₽',
      period: 'в месяц',
      features: [
        'Неограниченные цели',
        'Расширенная аналитика',
        'Командный доступ',
      ],
      highlighted: true,
    },
    {
      name: 'Teams',
      price: '999 ₽',
      period: 'в месяц',
      features: [
        'Общая панель целей',
        'API интеграции',
        'Приоритетная поддержка',
      ],
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-container">
        <div className="pricing-header">
          <h2>Гибкие тарифы под любые цели</h2>
          <p>Начните бесплатно и масштабируйтесь, когда будете готовы.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
            >
              <div className="pricing-card-header">
                <span className="pricing-card-name">{plan.name}</span>
                <div className="pricing-card-price">
                  <span className="pricing-card-amount">{plan.price}</span>
                  <span className="pricing-card-period">{plan.period}</span>
                </div>
              </div>
              <ul className="pricing-card-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? 'primary' : 'secondary'}
                className="pricing-card-button"
                onClick={() => {
                  window.location.href = '/auth';
                }}
              >
                Выбрать план
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: 'Нужны ли навыки управления проектами?',
      a: 'Нет. Интерфейс построен вокруг простых вопросов “цель — прогресс — результат”, поэтому подойдёт как новичкам, так и опытным менеджерам.',
    },
    {
      q: 'Можно ли подключить команду?',
      a: 'Да. План Pro и Teams позволяют приглашать коллег, делиться целью и отслеживать общий прогресс.',
    },
    {
      q: 'Есть ли мобильная версия?',
      a: 'Интерфейс полностью адаптивен. Web-приложение корректно работает на смартфонах и планшетах.',
    },
  ];

  return (
    <section id="faq" className="faq-section">
      <div className="faq-container">
        <h2 className="faq-title">Частые вопросы</h2>
        <div className="faq-grid">
          {items.map((item) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="faq-item"
            >
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">
        <div className="contact-card">
          <div className="contact-text">
            <h3>Свяжитесь с нами</h3>
            <p>
              Поддержка отвечает ежедневно с 9:00 до 19:00 по МСК. Напишите или
              позвоните нам — поможем с запуском.
            </p>
          </div>
          <div className="contact-actions">
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = 'mailto:hello@goalflow.app';
              }}
            >
              hello@goalflow.app
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = 'tel:+74951234567';
              }}
            >
              +7 (495) 123-45-67
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <div className="cta-decoration" />
          <div className="cta-content">
            <div className="cta-text-content">
              <h3 className="cta-title">Готовы сосредоточиться на главном?</h3>
              <p className="cta-text">
                Присоединяйтесь бесплатно — настройка займёт минуты.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => {
                window.location.href = '/auth';
              }}
              className="landing-cta-button"
            >
              Начать бесплатно
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <p className="landing-footer-text">
          © {new Date().getFullYear()} focusloop. Все права защищены.
        </p>
        <div className="landing-footer-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#contact">Contacts</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/goals';
    }
  }, [isAuthenticated]);

  return (
    <div className="landing-page">
      <LandingHeader onMenuClick={() => setDrawerOpen(true)} isAuthenticated={isAuthenticated} />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <nav className="landing-nav">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="landing-nav-item"
              onClick={() => setDrawerOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="landing-nav-divider" />
          <Button
            variant="primary"
            rightIcon={<ArrowRight size={16} />}
            onClick={() => {
              window.location.href = '/auth';
            }}
            className="landing-nav-button"
          >
            Начать бесплатно
          </Button>
        </nav>
      </Drawer>

      <main>
        <Hero />
        <ValueCards />
        <FeaturePreview />
        <Steps />
        <SocialProof />
        <Pricing />
        <FAQ />
        <Contact />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
