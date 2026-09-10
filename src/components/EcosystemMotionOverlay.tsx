import React from 'react';

interface EcosystemMotionOverlayProps {
  activeRole?: string | null;
  isMotionActive?: boolean;
}

export const EcosystemMotionOverlay: React.FC<EcosystemMotionOverlayProps> = ({
  activeRole = null,
  isMotionActive = true,
}) => {
  if (!isMotionActive) return null;

  // Determine which streams are highlighted based on activeRole
  const highlightBlue = !activeRole || activeRole === 'admin' || activeRole === 'staff' || activeRole === 'pm';
  const highlightOrange = !activeRole || activeRole === 'admin' || activeRole === 'hr';
  const highlightPurple = !activeRole || activeRole === 'admin' || activeRole === 'pm';
  const highlightTeal = !activeRole || activeRole === 'admin' || activeRole === 'hr';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      <svg
        viewBox="0 0 939 533"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-core" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients for Flow Streams */}
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="1" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="grad-orange" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="grad-purple" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="grad-teal" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0d9488" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
          </linearGradient>

          {/* Center Hub Core Radial Aura */}
          <radialGradient id="core-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#0066ff" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#1e40af" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ========================================================================= */}
        {/* 1. CENTRAL HUB (PRIME HRIS) REACTOR BREATHING GLOW & EXPANDING PULSES     */}
        {/* ========================================================================= */}
        <g id="central-hub-effects">
          {/* Core Ambient Aura */}
          <ellipse
            cx="470"
            cy="258"
            rx="85"
            ry="55"
            fill="url(#core-aura)"
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />

          {/* Central Reactor Expanding Sonar Pulse 1 */}
          <circle
            cx="470"
            cy="258"
            r="30"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            opacity="0"
          >
            <animate attributeName="r" values="30;85" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="2;0.5" dur="3.2s" repeatCount="indefinite" />
          </circle>

          {/* Central Reactor Expanding Sonar Pulse 2 (Staggered) */}
          <circle
            cx="470"
            cy="258"
            r="30"
            fill="none"
            stroke="#0066ff"
            strokeWidth="1.8"
            opacity="0"
          >
            <animate attributeName="r" values="25;75" dur="3.2s" begin="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65;0" dur="3.2s" begin="1.6s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1.8;0.5" dur="3.2s" begin="1.6s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ========================================================================= */}
        {/* 2. THE 4 STATION BEACON PULSES                                           */}
        {/* ========================================================================= */}
        <g id="station-beacons">
          {/* Node 01: Teknisi Lapangan Beacon (Top Left) */}
          <circle cx="210" cy="185" r="18" fill="none" stroke="#0284c7" strokeWidth="1.5" opacity="0">
            <animate attributeName="r" values="14;34" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* Node 02: HR Admin Beacon (Top Right) */}
          <circle cx="735" cy="185" r="18" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0">
            <animate attributeName="r" values="14;34" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
          </circle>

          {/* Node 03: Keamanan Data Beacon (Bottom Right) */}
          <circle cx="735" cy="345" r="18" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0">
            <animate attributeName="r" values="14;34" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Node 04: Data Real-time Beacon (Bottom Left) */}
          <circle cx="220" cy="355" r="18" fill="none" stroke="#9333ea" strokeWidth="1.5" opacity="0">
            <animate attributeName="r" values="14;34" dur="2.4s" begin="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2.4s" begin="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ========================================================================= */}
        {/* 3. FLOWING DATA PIPELINES (CURVED FLOW BEAMS & MOVING PACKETS)            */}
        {/* ========================================================================= */}

        {/* ------------------------------------------------------------------------- */}
        {/* FLOW 1: BLUE PIPELINE (Teknisi Lapangan -> Hub)                           */}
        {/* ------------------------------------------------------------------------- */}
        <g id="flow-blue" opacity={highlightBlue ? 1 : 0.25} className="transition-opacity duration-300">
          {/* Static Glowing Guide Path */}
          <path
            d="M 235 175 C 280 190, 340 175, 408 222"
            fill="none"
            stroke="url(#grad-blue)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Flowing Animated Dash Beam */}
          <path
            d="M 235 175 C 280 190, 340 175, 408 222"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14 18"
            filter="url(#glow-blue)"
            style={{
              animation: 'dashFlow 1.8s linear infinite',
            }}
          />

          {/* Data Packet Photon 1 */}
          <circle r="4.5" fill="#38bdf8" filter="url(#glow-blue)">
            <animateMotion
              path="M 235 175 C 280 190, 340 175, 408 222"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2.5" fill="#ffffff">
            <animateMotion
              path="M 235 175 C 280 190, 340 175, 408 222"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Data Packet Photon 2 (Offset by half cycle) */}
          <circle r="3.8" fill="#60a5fa" filter="url(#glow-blue)">
            <animateMotion
              path="M 235 175 C 280 190, 340 175, 408 222"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2" fill="#ffffff">
            <animateMotion
              path="M 235 175 C 280 190, 340 175, 408 222"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* FLOW 2: ORANGE PIPELINE (HR Admin -> Hub)                                 */}
        {/* ------------------------------------------------------------------------- */}
        <g id="flow-orange" opacity={highlightOrange ? 1 : 0.25} className="transition-opacity duration-300">
          {/* Static Glowing Guide Path */}
          <path
            d="M 700 182 C 650 190, 590 175, 532 222"
            fill="none"
            stroke="url(#grad-orange)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Flowing Animated Dash Beam */}
          <path
            d="M 700 182 C 650 190, 590 175, 532 222"
            fill="none"
            stroke="#fb923c"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14 18"
            filter="url(#glow-orange)"
            style={{
              animation: 'dashFlow 1.8s linear infinite',
            }}
          />

          {/* Data Packet Photon 1 */}
          <circle r="4.5" fill="#f59e0b" filter="url(#glow-orange)">
            <animateMotion
              path="M 700 182 C 650 190, 590 175, 532 222"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2.5" fill="#ffffff">
            <animateMotion
              path="M 700 182 C 650 190, 590 175, 532 222"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Data Packet Photon 2 */}
          <circle r="3.8" fill="#fb923c" filter="url(#glow-orange)">
            <animateMotion
              path="M 700 182 C 650 190, 590 175, 532 222"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2" fill="#ffffff">
            <animateMotion
              path="M 700 182 C 650 190, 590 175, 532 222"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* FLOW 3: PURPLE PIPELINE (Data Real-time -> Hub)                           */}
        {/* ------------------------------------------------------------------------- */}
        <g id="flow-purple" opacity={highlightPurple ? 1 : 0.25} className="transition-opacity duration-300">
          {/* Static Glowing Guide Path */}
          <path
            d="M 260 360 C 320 355, 365 335, 408 298"
            fill="none"
            stroke="url(#grad-purple)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Flowing Animated Dash Beam */}
          <path
            d="M 260 360 C 320 355, 365 335, 408 298"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14 18"
            filter="url(#glow-purple)"
            style={{
              animation: 'dashFlow 1.8s linear infinite',
            }}
          />

          {/* Data Packet Photon 1 */}
          <circle r="4.5" fill="#c084fc" filter="url(#glow-purple)">
            <animateMotion
              path="M 260 360 C 320 355, 365 335, 408 298"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2.5" fill="#ffffff">
            <animateMotion
              path="M 260 360 C 320 355, 365 335, 408 298"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Data Packet Photon 2 */}
          <circle r="3.8" fill="#d8b4fe" filter="url(#glow-purple)">
            <animateMotion
              path="M 260 360 C 320 355, 365 335, 408 298"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2" fill="#ffffff">
            <animateMotion
              path="M 260 360 C 320 355, 365 335, 408 298"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* FLOW 4: TEAL PIPELINE (Keamanan Data -> Hub)                              */}
        {/* ------------------------------------------------------------------------- */}
        <g id="flow-teal" opacity={highlightTeal ? 1 : 0.25} className="transition-opacity duration-300">
          {/* Static Glowing Guide Path */}
          <path
            d="M 675 360 C 615 350, 570 335, 532 298"
            fill="none"
            stroke="url(#grad-teal)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Flowing Animated Dash Beam */}
          <path
            d="M 675 360 C 615 350, 570 335, 532 298"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14 18"
            filter="url(#glow-teal)"
            style={{
              animation: 'dashFlow 1.8s linear infinite',
            }}
          />

          {/* Data Packet Photon 1 */}
          <circle r="4.5" fill="#14b8a6" filter="url(#glow-teal)">
            <animateMotion
              path="M 675 360 C 615 350, 570 335, 532 298"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2.5" fill="#ffffff">
            <animateMotion
              path="M 675 360 C 615 350, 570 335, 532 298"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Data Packet Photon 2 */}
          <circle r="3.8" fill="#5eead4" filter="url(#glow-teal)">
            <animateMotion
              path="M 675 360 C 615 350, 570 335, 532 298"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2" fill="#ffffff">
            <animateMotion
              path="M 675 360 C 615 350, 570 335, 532 298"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* ========================================================================= */}
        {/* 4. FLOATING DATA ICON SUBTLE PULSES                                       */}
        {/* ========================================================================= */}
        <g id="floating-icon-pulses">
          {/* Location Pin aura at (315, 160) */}
          <circle cx="315" cy="160" r="10" fill="#38bdf8" opacity="0.15" className="animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* Wi-Fi aura at (360, 165) */}
          <circle cx="360" cy="165" r="10" fill="#0284c7" opacity="0.15" className="animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />

          {/* Lock aura at (595, 330) */}
          <circle cx="595" cy="330" r="10" fill="#14b8a6" opacity="0.15" className="animate-ping" style={{ animationDuration: '3.2s', animationDelay: '1s' }} />

          {/* Database aura at (345, 330) */}
          <circle cx="345" cy="330" r="10" fill="#a855f7" opacity="0.15" className="animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.5s' }} />
        </g>
      </svg>
    </div>
  );
};
