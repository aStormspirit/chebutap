type Props = {
  pressed?: boolean;
};

export function ChebuCharacter({ pressed = false }: Props) {
  return (
    <svg
      className={`chebu ${pressed ? 'chebu--pressed' : ''}`}
      viewBox="0 0 240 260"
      aria-hidden
    >
      <defs>
        <radialGradient id="bodyGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#f0a94a" />
          <stop offset="100%" stopColor="#c77a2a" />
        </radialGradient>
        <radialGradient id="bodyMain" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd978" />
          <stop offset="45%" stopColor="#f0b24a" />
          <stop offset="100%" stopColor="#d8892e" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#8a5a20" floodOpacity="0.35" />
        </filter>
      </defs>

      <ellipse cx="120" cy="248" rx="54" ry="10" fill="#000" opacity="0.12" />

      <g filter="url(#softShadow)">
        <ellipse cx="120" cy="150" rx="92" ry="78" fill="url(#bodyMain)" />
        <ellipse cx="120" cy="150" rx="92" ry="78" fill="none" stroke="#c76e28" strokeWidth="4" />
        <path
          d="M40 150 Q120 55 200 150 Q120 235 40 150Z"
          fill="url(#bodyGlow)"
          opacity="0.55"
        />
        <ellipse cx="78" cy="118" rx="18" ry="12" fill="#fff3c4" opacity="0.55" />
        <ellipse cx="150" cy="128" rx="10" ry="7" fill="#fff3c4" opacity="0.35" />
        <ellipse cx="96" cy="176" rx="8" ry="5" fill="#e09830" opacity="0.45" />
        <ellipse cx="158" cy="168" rx="11" ry="7" fill="#e09830" opacity="0.4" />
        <ellipse cx="120" cy="140" rx="6" ry="4" fill="#e09830" opacity="0.35" />
      </g>

      <circle cx="92" cy="138" r="11" fill="#1a120c" />
      <circle cx="148" cy="138" r="11" fill="#1a120c" />
      <circle cx="95" cy="134" r="3.5" fill="#fff" />
      <circle cx="151" cy="134" r="3.5" fill="#fff" />

      <path
        d="M100 168 Q120 188 140 168"
        fill="none"
        stroke="#1a120c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="108" cy="162" r="5" fill="#f08a7a" opacity="0.55" />
      <circle cx="132" cy="162" r="5" fill="#f08a7a" opacity="0.55" />

      <path
        d="M48 110 Q28 70 42 48"
        fill="none"
        stroke="#1a120c"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M192 110 Q212 70 198 48"
        fill="none"
        stroke="#1a120c"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="42" cy="48" r="7" fill="#1a120c" />
      <circle cx="198" cy="48" r="7" fill="#1a120c" />

      <path
        d="M88 220 Q96 238 104 220"
        fill="none"
        stroke="#1a120c"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M136 220 Q144 238 152 220"
        fill="none"
        stroke="#1a120c"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
