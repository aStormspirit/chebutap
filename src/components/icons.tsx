type IconProps = { className?: string };

export function CoinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#f5c84a" stroke="#c98a18" strokeWidth="2" />
      <circle cx="16" cy="16" r="10" fill="#ffe27a" stroke="#e0a828" strokeWidth="1.5" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="#b87312"
        fontFamily="Nunito, sans-serif"
      >
        C
      </text>
    </svg>
  );
}

export function DiamondIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 2 L28 12 L16 30 L4 12 Z" fill="#5ec8ff" stroke="#2a8fd4" strokeWidth="2" />
      <path d="M16 2 L22 12 L16 30 L10 12 Z" fill="#9ae0ff" opacity="0.7" />
      <path d="M4 12 H28" stroke="#fff" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path
        d="M24 4 C28 12 36 16 36 28 C36 36 30 42 24 42 C18 42 12 36 12 28 C12 20 18 14 20 8 C22 12 24 14 24 4Z"
        fill="#ff8a3a"
        stroke="#c24a10"
        strokeWidth="2"
      />
      <path d="M24 20 C26 24 30 26 30 32 C30 36 27 39 24 39 C21 39 18 36 18 32 C18 28 21 25 24 20Z" fill="#ffe08a" />
    </svg>
  );
}

export function ShopIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <rect x="8" y="22" width="32" height="20" rx="3" fill="#8b5a2b" stroke="#5c3a18" strokeWidth="2" />
      <path d="M6 22 L12 10 H36 L42 22 Z" fill="#d4a056" stroke="#8b5a2b" strokeWidth="2" />
      <rect x="18" y="28" width="12" height="14" rx="1.5" fill="#f0d090" />
      <circle cx="16" cy="16" r="2" fill="#fff" />
      <circle cx="24" cy="14" r="2" fill="#fff" />
      <circle cx="32" cy="16" r="2" fill="#fff" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" fill="#ffe14a" stroke="#c9a010" strokeWidth="1.5" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M13 3 H19 L20.5 7.5 L25 6 L28 10 L24.5 13.5 L29 16 L24.5 18.5 L28 22 L25 26 L20.5 24.5 L19 29 H13 L11.5 24.5 L7 26 L4 22 L7.5 18.5 L3 16 L7.5 13.5 L4 10 L7 6 L11.5 7.5 Z"
        fill="#8b5a2b"
        stroke="#5c3a18"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="4.5" fill="#f0d090" stroke="#5c3a18" strokeWidth="1.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#6fcf63" stroke="#3a9a40" strokeWidth="1.5" />
      <path d="M10 5 V15 M5 10 H15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
