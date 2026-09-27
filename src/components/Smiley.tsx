interface Props {
  /** -1 (sad) to 1 (happy). */
  mood: number;
  color: string;
  size?: number;
}

/** A simple flat smiley face: two dot eyes and a mouth curve driven by `mood`. */
export function Smiley({ mood, color, size = 40 }: Props) {
  const cpOffset = mood * 6;
  const mouthPath = `M 13,26 Q 20,${26 + cpOffset} 27,26`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Smiley">
      <circle cx="20" cy="20" r="19" fill={color} stroke="rgba(0,0,0,0.15)" />
      <circle cx="14" cy="16" r="2.2" fill="#1a1a1a" />
      <circle cx="26" cy="16" r="2.2" fill="#1a1a1a" />
      <path d={mouthPath} stroke="#1a1a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
