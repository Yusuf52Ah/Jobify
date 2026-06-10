type JobifyLogoProps = {
  size?: number;
  className?: string;
};

export function JobifyLogo({ size = 96, className = "" }: JobifyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Jobify logosi"
      className={`block ${className}`.trim()}
    >
      <defs>
        <linearGradient id="jobifySuitcase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2da7e6" />
          <stop offset="52%" stopColor="#1468a8" />
          <stop offset="100%" stopColor="#43d16b" />
        </linearGradient>
        <linearGradient id="jobifyArrow" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#eef8ff" />
          <stop offset="100%" stopColor="#d8fff0" />
        </linearGradient>
        <filter id="jobifyShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="13" y="18" width="70" height="56" rx="14" fill="#ffffff" filter="url(#jobifyShadow)" />
      <path
        d="M24 41c0-7 5.5-12 12.2-12h23.6C66.5 29 72 34 72 41v15c0 6.7-5.2 12-11.8 12H35.8C29.2 68 24 62.7 24 56V41Z"
        fill="url(#jobifySuitcase)"
      />
      <path
        d="M34 31.5c0-4.6 3.7-8.3 8.3-8.3h11.4c4.6 0 8.3 3.7 8.3 8.3v3.7H34v-3.7Z"
        fill="#173d6a"
        opacity="0.95"
      />
      <path
        d="M33 40.5h31.4l-2.6 13.2c-.4 2-2.1 3.5-4.2 3.5H39.8c-2.1 0-3.8-1.5-4.2-3.5L33 40.5Z"
        fill="#f7fbff"
        opacity="0.95"
      />
      <path
        d="M38 46c5.5 0 8.7 4 12 7.7 2.2 2.5 4.7 4.8 8.2 4.8"
        fill="none"
        stroke="#2a7bd6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M45 60c-1.8 0-3.1-1.2-3.1-2.8 0-1.1.6-2 1.5-2.7l5.7-4.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 50.5l9.2-12.4h-6.2l15.6-10.2-3.4 7.2h7.4L59.8 53.4l-1.4-4.2z"
        fill="url(#jobifyArrow)"
      />
      <circle cx="72" cy="28" r="7.5" fill="#42c94b" />
      <path
        d="M69 28.1h6M72.1 25l-3.2 3.2 3.2 3.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
