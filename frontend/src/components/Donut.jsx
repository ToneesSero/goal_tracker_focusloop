import './Donut.css';

export default function Donut({ value, color = '#06B6D4', size = 120 }) {
  const stroke = 12;
  const radius = (size / 2) - stroke;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = ((100 - value) / 100) * circumference;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="#E2E8F0"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="donut-content">
        <div className="donut-value">{value}%</div>
        <div className="donut-label">выполнено</div>
      </div>
    </div>
  );
}
