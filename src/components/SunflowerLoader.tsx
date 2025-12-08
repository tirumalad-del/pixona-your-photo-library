import { motion } from "framer-motion";

interface SunflowerLoaderProps {
  size?: number;
  className?: string;
}

export function SunflowerLoader({ size = 48, className = "" }: SunflowerLoaderProps) {
  const petalCount = 24;
  const centerSize = size * 0.28;
  const petalLength = size * 0.32;
  const petalWidth = size * 0.08;

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glowing background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 200, 50, 0.3) 0%, rgba(255, 150, 0, 0.15) 50%, transparent 70%)",
          filter: "blur(6px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* All 24 petals - one animates at a time */}
      <div className="absolute inset-0">
        {Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i * 360) / petalCount;
          // Each petal animates for a short duration, then the next one starts
          // Total cycle time = petalCount * 0.15s = 3.6s for full rotation
          const delay = i * 0.15;
          const cycleDuration = petalCount * 0.15;
          
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                width: petalWidth,
                height: petalLength,
                marginLeft: -petalWidth / 2,
                marginTop: -petalLength - centerSize / 2 + 2,
                transformOrigin: `50% ${petalLength + centerSize / 2 - 2}px`,
                transform: `rotate(${angle}deg)`,
              }}
            >
              {/* Petal with sequential animation */}
              <motion.div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(180deg, #FFE135 0%, #FFD700 30%, #FFA500 70%, #FF8C00 100%)",
                  borderRadius: "50% 50% 45% 45%",
                  boxShadow: "0 0 3px rgba(255, 165, 0, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)",
                }}
                // ⬅️ UPDATED ANIMATION LOGIC (lines 69-79 in original)
                animate={{
                  opacity: [1, 0, 0, 1], // Petal fades out/in
                  scaleY: [1, 0.2, 0.2, 1], // Collapses like closing
                }}
                transition={{
                  duration: 0.08,
                  delay: delay,
                  repeat: Infinity,
                  repeatDelay: cycleDuration - 0.08,
                  ease: "linear",
                }}
                // ⬆️ END UPDATED ANIMATION LOGIC
              />
            </motion.div>
          );
        })}
      </div>

      {/* Center of sunflower */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: centerSize,
          height: centerSize,
          marginLeft: -centerSize / 2,
          marginTop: -centerSize / 2,
          background: "radial-gradient(circle at 35% 35%, #A0522D 0%, #8B4513 30%, #654321 60%, #3D2914 100%)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 0 6px rgba(139, 69, 19, 0.4), inset 0 -1px 2px rgba(255,255,255,0.1)",
        }}
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Seed pattern dots */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => {
            const seedAngle = (i * 45) * (Math.PI / 180);
            const radius = centerSize * 0.25;
            return (
              <div
                key={i}
                className="absolute rounded-full bg-amber-900/70"
                style={{
                  width: 2,
                  height: 2,
                  left: `calc(50% + ${Math.cos(seedAngle) * radius}px - 1px)`,
                  top: `calc(50% + ${Math.sin(seedAngle) * radius}px - 1px)`,
                }}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// Static icon version for app icon / export
export function SunflowerIcon({ size = 24, className = "" }: SunflowerLoaderProps) {
  const petalCount = 24;
  const centerRadius = size * 0.14;
  const petalLength = size * 0.28;
  const petalWidth = size * 0.07;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <defs>
        <radialGradient id="sunflowerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFA500" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sunflowerPetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE135" />
          <stop offset="30%" stopColor="#FFD700" />
          <stop offset="70%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <radialGradient id="sunflowerCenter" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="30%" stopColor="#8B4513" />
          <stop offset="60%" stopColor="#654321" />
          <stop offset="100%" stopColor="#3D2914" />
        </radialGradient>
        <filter id="petalGlow">
          <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow background */}
      <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#sunflowerGlow)" />
      
      {/* All 24 Petals */}
      <g filter="url(#petalGlow)">
        {Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i * 360) / petalCount - 90;
          const radians = (angle * Math.PI) / 180;
          const petalCenterDist = centerRadius + petalLength / 2 + 1;
          const petalX = cx + Math.cos(radians) * petalCenterDist;
          const petalY = cy + Math.sin(radians) * petalCenterDist;
          
          return (
            <ellipse
              key={i}
              cx={petalX}
              cy={petalY}
              rx={petalWidth}
              ry={petalLength / 2}
              fill="url(#sunflowerPetal)"
              transform={`rotate(${angle + 90}, ${petalX}, ${petalY})`}
            />
          );
        })}
      </g>
      
      {/* Center */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={centerRadius} 
        fill="url(#sunflowerCenter)"
      />
      
      {/* Center highlight */}
      <circle 
        cx={cx - centerRadius * 0.2} 
        cy={cy - centerRadius * 0.2} 
        r={centerRadius * 0.3} 
        fill="rgba(255,255,255,0.15)"
      />
    </svg>
  );
}
