import React, { useState, useMemo, useCallback } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Shield, FlaskConical, Microscope, Heart, Dna, Pill, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

/* ═══════════════════════════════════════════════
   SVG ANIMATION COMPONENTS — RICH & VIBRANT
═══════════════════════════════════════════════ */

/* ─── Animated DNA Double Helix (Login Side) ─── */
function DNAHelixAnimation() {
  const pairs = Array.from({ length: 16 }, (_, i) => i);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="200" height="500" viewBox="0 0 200 500" className="opacity-40 dark:opacity-25">
        <defs>
          <linearGradient id="dna-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="dna-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="dna-bond-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {pairs.map((i) => {
          const y = i * 30 + 15;
          const phase = (i * Math.PI) / 4;
          const x1 = 50 + Math.sin(phase) * 40;
          const x2 = 150 - Math.sin(phase) * 40;
          const opacity = 0.4 + Math.abs(Math.sin(phase)) * 0.6;
          return (
            <g key={i}>
              {/* Bond line */}
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="url(#dna-bond-grad)" strokeWidth="2" opacity={opacity * 0.6}>
                <animate attributeName="opacity" values={`${opacity * 0.3};${opacity * 0.8};${opacity * 0.3}`} dur="3s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
              </line>
              {/* Left node */}
              <circle cx={x1} cy={y} r="7" fill="url(#dna-left)" opacity={opacity} filter="url(#glow-blue)">
                <animate attributeName="cy" values={`${y};${y - 5};${y}`} dur="3.5s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
                <animate attributeName="r" values="7;9;7" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
              </circle>
              {/* Right node */}
              <circle cx={x2} cy={y} r="7" fill="url(#dna-right)" opacity={opacity} filter="url(#glow-green)">
                <animate attributeName="cy" values={`${y};${y + 5};${y}`} dur="3.5s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
                <animate attributeName="r" values="7;8;7" dur="2s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Heartbeat ECG Line ─── */
function HeartbeatWave() {
  return (
    <div className="absolute bottom-16 left-0 right-0 h-20 overflow-hidden opacity-30 dark:opacity-20">
      <svg viewBox="0 0 1200 80" className="w-[300%] h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="20%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="80%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,40 L80,40 L100,40 L115,40 L130,15 L145,65 L160,5 L175,75 L190,40 L210,40 L300,40 L320,40 L335,40 L350,15 L365,65 L380,5 L395,75 L410,40 L430,40 L600,40 L620,40 L635,40 L650,15 L665,65 L680,5 L695,75 L710,40 L730,40 L900,40"
          fill="none"
          stroke="url(#ecg-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;-600,0"
            dur="5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
}

/* ─── Floating Medical Particles ─── */
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: 4 + Math.random() * 12,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 6,
      type: i % 4,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => {
        const colors = [
          'radial-gradient(circle, rgba(6, 182, 212, 0.7), transparent)',    // Cyan
          'radial-gradient(circle, rgba(20, 184, 166, 0.7), transparent)',    // Teal
          'radial-gradient(circle, rgba(168, 85, 247, 0.5), transparent)',    // Purple
          'radial-gradient(circle, rgba(34, 197, 94, 0.6), transparent)',     // Green
        ];
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              borderRadius: '50%',
              background: colors[p.type],
              animation: `particleFloat ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              opacity: 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Orbiting Molecule Network (Signup Side) ─── */
function MoleculeVisualization() {
  return (
    <div className="absolute inset-0 opacity-35 dark:opacity-20">
      <svg width="100%" height="100%" viewBox="0 0 500 500">
        <defs>
          <linearGradient id="mol-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="mol-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="mol-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="mol-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Central pulsing core */}
        <circle cx="250" cy="250" r="18" fill="url(#mol-grad-2)" filter="url(#mol-glow)">
          <animate attributeName="r" values="18;22;18" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Inner ring */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 250 + Math.cos(rad) * 90;
          const cy = 250 + Math.sin(rad) * 90;
          return (
            <g key={`inner-${i}`}>
              <line x1="250" y1="250" x2={cx} y2={cy} stroke={i % 2 === 0 ? '#06b6d4' : '#a855f7'} strokeWidth="1.5" opacity="0.4">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </line>
              <circle cx={cx} cy={cy} r="10" fill={i % 2 === 0 ? 'url(#mol-grad-1)' : 'url(#mol-grad-3)'} filter="url(#mol-glow)">
                <animate attributeName="r" values="10;13;10" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Outer ring */}
        {[30, 90, 150, 210, 270, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const parentRad = ((angle - 30) * Math.PI) / 180;
          const cx = 250 + Math.cos(rad) * 160;
          const cy = 250 + Math.sin(rad) * 160;
          const px = 250 + Math.cos(parentRad) * 90;
          const py = 250 + Math.sin(parentRad) * 90;
          return (
            <g key={`outer-${i}`}>
              <line x1={px} y1={py} x2={cx} y2={cy} stroke="#14b8a6" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.15;0.45;0.15" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
              </line>
              <circle cx={cx} cy={cy} r="6" fill="url(#mol-grad-3)" opacity="0.6">
                <animate attributeName="r" values="6;9;6" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Outermost particles */}
        {[15, 75, 135, 195, 255, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 250 + Math.cos(rad) * 210;
          const cy = 250 + Math.sin(rad) * 210;
          return (
            <circle key={`far-${i}`} cx={cx} cy={cy} r="4" fill={i % 2 === 0 ? '#06b6d4' : '#a855f7'} opacity="0.3">
              <animate attributeName="r" values="4;6;4" dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* Rotating orbit ring */}
        <circle cx="250" cy="250" r="90" fill="none" stroke="url(#mol-grad-1)" strokeWidth="0.5" opacity="0.2" strokeDasharray="8 8">
          <animateTransform attributeName="transform" type="rotate" values="0 250 250;360 250 250" dur="30s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="250" r="160" fill="none" stroke="url(#mol-grad-3)" strokeWidth="0.5" opacity="0.15" strokeDasharray="5 10">
          <animateTransform attributeName="transform" type="rotate" values="360 250 250;0 250 250" dur="40s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/* ─── Floating Capsules (Signup Side) ─── */
function FloatingCapsules() {
  const capsules = [
    { x: 12, y: 15, size: 1.2, delay: 0, dur: 9, rot: -25, c1: '#06b6d4', c2: '#e0f2fe' },
    { x: 78, y: 25, size: 1, delay: 1.5, dur: 11, rot: 35, c1: '#a855f7', c2: '#fae8ff' },
    { x: 35, y: 55, size: 0.8, delay: 3, dur: 13, rot: -45, c1: '#14b8a6', c2: '#ccfbf1' },
    { x: 88, y: 65, size: 1.1, delay: 0.5, dur: 10, rot: 20, c1: '#3b82f6', c2: '#dbeafe' },
    { x: 20, y: 78, size: 0.9, delay: 2, dur: 12, rot: -35, c1: '#22c55e', c2: '#dcfce7' },
    { x: 60, y: 85, size: 0.7, delay: 4, dur: 14, rot: 50, c1: '#ec4899', c2: '#fce7f3' },
    { x: 50, y: 10, size: 0.6, delay: 5, dur: 15, rot: -60, c1: '#f59e0b', c2: '#fef3c7' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 dark:opacity-15">
      {capsules.map((c, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${c.x}%`, top: `${c.y}%`,
            transform: `rotate(${c.rot}deg) scale(${c.size})`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
          }}
        >
          <div className="w-6 h-14 rounded-[12px] overflow-hidden shadow-lg" style={{ boxShadow: `0 4px 20px ${c.c1}30` }}>
            <div className="h-1/2" style={{ background: `linear-gradient(135deg, ${c.c1}, ${c.c1}dd)` }} />
            <div className="h-1/2" style={{ background: `linear-gradient(135deg, ${c.c2}, white)` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Pulsing Rings Background ─── */
function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[120, 200, 300].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: `2px solid`,
            borderColor: i === 0 ? 'rgba(6, 182, 212, 0.15)' : i === 1 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(20, 184, 166, 0.08)',
            animation: `pulseRing ${3 + i}s cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════
   PASSWORD STRENGTH
═══════════════════════════════════════ */
function getPasswordStrength(pw: string): { level: number; label: string; colors: string[] } {
  if (!pw) return { level: 0, label: '', colors: [] };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', colors: ['#ef4444', '#f87171'] };
  if (score <= 2) return { level: 2, label: 'Fair', colors: ['#f59e0b', '#fbbf24'] };
  if (score <= 3) return { level: 3, label: 'Good', colors: ['#14b8a6', '#2dd4bf'] };
  return { level: 4, label: 'Strong', colors: ['#22c55e', '#4ade80'] };
}


/* ═══════════════════════════════════════
   MAIN AUTH COMPONENT
═══════════════════════════════════════ */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const pwStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const { data } = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('access_token', data.access_token);
        const meRes = await api.get('/auth/me');
        login(data.access_token, meRes.data);
      } else {
        const { data } = await api.post('/auth/signup', {
          email,
          password,
          full_name: fullName || email.split('@')[0]
        });
        localStorage.setItem('access_token', data.access_token);
        const meRes = await api.get('/auth/me');
        login(data.access_token, meRes.data);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response) {
        setError(error.response.data.detail || 'An error occurred');
      } else {
        setError('Network error or server unreachable');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = useCallback((mode: boolean) => {
    setIsLogin(mode);
    setError('');
    setPassword('');
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdfa 50%, #ecfdf5 75%, #f0f9ff 100%)',
    }}>
      {/* Dark mode background override */}
      <div className="absolute inset-0 hidden dark:block" style={{
        background: 'linear-gradient(135deg, #0b1929 0%, #0a1a2f 30%, #0c1a28 60%, #0b1929 100%)',
      }} />

      {/* ─────── LEFT: Animation Panel ─────── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[120px] animate-blob"
          style={{ background: 'rgba(6, 182, 212, 0.2)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[100px] animate-blob animation-delay-2000"
          style={{ background: 'rgba(59, 130, 246, 0.15)' }} />
        <div className="absolute top-[50%] left-[40%] w-[30%] h-[30%] rounded-full blur-[80px] animate-blob animation-delay-4000"
          style={{ background: 'rgba(20, 184, 166, 0.12)' }} />

        {/* Particles always present */}
        <FloatingParticles />
        <PulsingRings />

        {/* Mode-specific animations */}
        {isLogin ? (
          <>
            <DNAHelixAnimation />
            <HeartbeatWave />
          </>
        ) : (
          <>
            <MoleculeVisualization />
            <FloatingCapsules />
          </>
        )}

        {/* Center content */}
        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="relative inline-block mb-8">
            {/* Glow behind icon */}
            <div className="absolute inset-0 rounded-3xl blur-xl" style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              opacity: 0.4,
              transform: 'scale(1.5)',
            }} />
            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform duration-500"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              }}
            >
              {isLogin ? (
                <Heart className="w-12 h-12 text-white animate-heartbeat" />
              ) : (
                <Dna className="w-12 h-12 text-white animate-spin-slow" />
              )}
            </div>
          </div>

          <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-slate-800 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Join PharmaAI'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed text-base">
            {isLogin
              ? 'Access your research dashboard and continue advancing pharmaceutical intelligence with AI.'
              : 'Start your journey with AI-driven molecular analysis, clinical trial intelligence, and drug discovery.'}
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { icon: Shield, label: 'HIPAA Ready', color: '#06b6d4' },
              { icon: Microscope, label: 'Research Grade', color: '#0ea5e9' },
              { icon: FlaskConical, label: 'Lab Certified', color: '#14b8a6' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Icon className="w-4 h-4" style={{ color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Animated feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {(isLogin
              ? [
                { icon: Activity, label: 'Real-time Analysis' },
                { icon: Pill, label: 'Drug Intelligence' },
                { icon: Heart, label: 'Clinical Trials' },
              ]
              : [
                { icon: Dna, label: 'Genomics AI' },
                { icon: FlaskConical, label: 'Molecular Design' },
                { icon: Microscope, label: 'Patent Search' },
              ]
            ).map(({ icon: Icon, label }, i) => (
              <div key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm animate-fade-in-up"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  animationDelay: `${0.5 + i * 0.15}s`,
                  color: '#0e7490',
                }}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────── RIGHT: Auth Form ─────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile header */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PharmaAI</h1>
            <p className="text-xs text-slate-400 mt-1">Pharmaceutical Research Intelligence</p>
          </div>

          {/* Auth Card */}
          <div className="glass-panel rounded-3xl p-8 lg:p-10" style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)',
          }}>
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                {isLogin ? 'Sign in to your account' : 'Create your account'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {isLogin ? 'Enter your credentials to continue' : 'Start your pharmaceutical research journey'}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex mb-7 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  isLogin
                    ? 'text-white shadow-lg'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                style={isLogin ? { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' } : {}}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  !isLogin
                    ? 'text-white shadow-lg'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                style={!isLogin ? { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' } : {}}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ─── SIGNUP: Name field ─── */}
              {!isLogin && (
                <div className="group animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors duration-200" />
                    <input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 focus:outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                </div>
              )}

              {/* ─── Email ─── */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors duration-200" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 focus:outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
                    placeholder={isLogin ? "name@hospital.com" : "name@research-lab.com"}
                    required
                  />
                </div>
              </div>

              {/* ─── Password ─── */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors duration-200" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 focus:outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength (Signup only) */}
                {!isLogin && password && (
                  <div className="mt-3 space-y-1.5 animate-fade-in">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-500"
                          style={{
                            background: i <= pwStrength.level
                              ? `linear-gradient(90deg, ${pwStrength.colors[0]}, ${pwStrength.colors[1]})`
                              : '#e2e8f0',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: pwStrength.colors[0] }}>
                      {pwStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Forgot Password (Login only) */}
              {isLogin && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium text-cyan-500 hover:text-cyan-600 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl animate-fade-in" style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                  <p className="text-sm font-medium text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full py-3.5 text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 8px 30px rgba(6, 182, 212, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isLogin ? 'Signing in…' : 'Creating account…'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200/40 dark:border-slate-700/20">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" style={{ color: '#14b8a6' }} />
                <span>Enterprise-grade security • HIPAA ready • SOC 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
