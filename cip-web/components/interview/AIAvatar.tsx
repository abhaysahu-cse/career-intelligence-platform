'use client';

import { useEffect, useState } from 'react';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  state: AvatarState;
  speechText?: string;
  personaMode?: 'friendly' | 'strict' | 'faang';
}

export default function AIAvatar({ state, speechText, personaMode = 'friendly' }: Props) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blinkTick, setBlinkTick] = useState(false);

  // Lip-sync simulation while speaking
  useEffect(() => {
    if (state !== 'speaking') { setMouthOpen(false); return; }
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 150 + Math.random() * 100);
    return () => clearInterval(interval);
  }, [state]);

  // Natural blink
  useEffect(() => {
    const blink = setInterval(() => {
      setBlinkTick(true);
      setTimeout(() => setBlinkTick(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blink);
  }, []);

  const colors = {
    friendly: { primary: '#4F46E5', glow: 'rgba(79,70,229,0.3)', accent: '#818CF8' },
    strict: { primary: '#EF4444', glow: 'rgba(239,68,68,0.3)', accent: '#FCA5A5' },
    faang: { primary: '#06B6D4', glow: 'rgba(6,182,212,0.3)', accent: '#67E8F9' },
  }[personaMode];

  const stateLabel = {
    idle: 'Ready',
    listening: 'Listening...',
    thinking: 'Analyzing...',
    speaking: 'Speaking...',
  }[state];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Container */}
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className="absolute -inset-3 rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
            opacity: state === 'speaking' ? 0.8 : state === 'thinking' ? 0.5 : 0.2,
            animation: state === 'thinking' ? 'avatarPulse 1.5s ease-in-out infinite' : state === 'speaking' ? 'avatarPulse 0.8s ease-in-out infinite' : 'none',
          }}
        />

        {/* Main avatar circle */}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}10)`,
            border: `2px solid ${colors.primary}50`,
            boxShadow: state !== 'idle' ? `0 0 20px ${colors.glow}` : 'none',
            transform: state === 'speaking' ? 'scale(1.02)' : state === 'listening' ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          {/* Face SVG */}
          <svg viewBox="0 0 80 80" className="w-full h-full p-2">
            {/* Head outline */}
            <ellipse
              cx="40" cy="38" rx="24" ry="28"
              fill="none"
              stroke={colors.primary}
              strokeWidth="1.5"
              opacity="0.6"
            />

            {/* Left eye */}
            <ellipse
              cx="32" cy="33"
              rx="3" ry={blinkTick ? 0.5 : 3}
              fill={colors.accent}
              style={{ transition: 'ry 0.1s ease' }}
            />

            {/* Right eye */}
            <ellipse
              cx="48" cy="33"
              rx="3" ry={blinkTick ? 0.5 : 3}
              fill={colors.accent}
              style={{ transition: 'ry 0.1s ease' }}
            />

            {/* Eye glow */}
            {state === 'thinking' && (
              <>
                <circle cx="32" cy="33" r="4" fill={colors.primary} opacity="0.3">
                  <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="48" cy="33" r="4" fill={colors.primary} opacity="0.3">
                  <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Mouth */}
            {state === 'speaking' ? (
              <ellipse
                cx="40" cy="48"
                rx="6"
                ry={mouthOpen ? 4 : 1.5}
                fill={colors.primary}
                opacity="0.7"
                style={{ transition: 'ry 0.1s ease' }}
              />
            ) : (
              <path
                d={state === 'listening' ? 'M 34 47 Q 40 49 46 47' : 'M 34 47 Q 40 50 46 47'}
                fill="none"
                stroke={colors.accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            )}

            {/* Circuit lines (futuristic detail) */}
            <line x1="16" y1="30" x2="16" y2="45" stroke={colors.primary} strokeWidth="0.5" opacity="0.3" />
            <line x1="64" y1="30" x2="64" y2="45" stroke={colors.primary} strokeWidth="0.5" opacity="0.3" />
            <circle cx="16" cy="30" r="1" fill={colors.primary} opacity="0.4" />
            <circle cx="64" cy="30" r="1" fill={colors.primary} opacity="0.4" />
            <circle cx="16" cy="45" r="1" fill={colors.primary} opacity="0.4" />
            <circle cx="64" cy="45" r="1" fill={colors.primary} opacity="0.4" />
          </svg>

          {/* Sound wave overlay when speaking */}
          {state === 'speaking' && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{
                    background: colors.accent,
                    height: '8px',
                    animation: `soundWave 0.5s ease-in-out ${i * 0.08}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Listening ring animation */}
          {state === 'listening' && (
            <div className="absolute inset-0 rounded-full" style={{
              border: `1.5px solid ${colors.primary}40`,
              animation: 'listeningRing 2s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* State indicator dot */}
        <div className="absolute -bottom-0.5 right-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
          style={{
            background: state === 'speaking' ? '#22C55E' : state === 'thinking' ? '#F59E0B' : state === 'listening' ? '#EF4444' : '#64748B',
            borderColor: '#1E293B',
            animation: state === 'listening' ? 'subtlePulse 1.5s ease-in-out infinite' : 'none',
          }}>
          {state === 'listening' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>

      {/* State label */}
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.accent }}>
        {stateLabel}
      </div>

      {/* Speech Bubble */}
      {state === 'speaking' && speechText && (
        <div className="relative max-w-[200px] animate-fadeIn">
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{ background: `${colors.primary}20`, borderTop: `1px solid ${colors.primary}30`, borderLeft: `1px solid ${colors.primary}30` }} />
          {/* Bubble */}
          <div className="rounded-xl px-3 py-2 text-xs leading-relaxed"
            style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}25`, color: '#E2E8F0' }}>
            {speechText.length > 100 ? `${speechText.slice(0, 100)}...` : speechText}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); opacity: inherit; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes soundWave {
          0% { height: 3px; }
          100% { height: 10px; }
        }
        @keyframes listeningRing {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
