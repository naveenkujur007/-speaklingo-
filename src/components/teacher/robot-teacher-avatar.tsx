"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "correcting"
  | "happy";

interface RobotTeacherAvatarProps {
  state: AvatarState;
  speechText?: string;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

// Futuristic synthetic-human robot teacher avatar.
// Pale synthetic skin, ice-blue glowing eyes, mechanical neck,
// shoulder pauldrons, glowing star emblem. Lip-sync when speaking.
export function RobotTeacherAvatar({
  state,
  speechText,
  isSpeaking,
  size = "md",
}: RobotTeacherAvatarProps) {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!isSpeaking) {
      queueMicrotask(() => setMouthFrame(0));
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((f) => (f + 1) % 5);
    }, 130);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2800 + Math.random() * 3200;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  const sizeClass = {
    sm: "w-32 h-40",
    md: "w-48 h-60",
    lg: "w-60 h-72",
  }[size];

  const eyeGlow =
    state === "listening" || state === "happy"
      ? "#67e8f9"
      : state === "correcting"
      ? "#fbbf24"
      : state === "thinking"
      ? "#c4b5fd"
      : "#7dd3fc";

  const haloColor = {
    idle: "bg-sky-400/30",
    listening: "bg-cyan-400/40",
    thinking: "bg-violet-400/40",
    speaking: "bg-sky-400/50",
    correcting: "bg-amber-400/50",
    happy: "bg-emerald-400/50",
  }[state];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-3 w-full justify-center">
        {/* Speech bubble */}
        <div className="flex-1 max-w-xs order-1">
          <AnimatePresence mode="wait">
            {speechText && (
              <motion.div
                key={speechText.slice(0, 30)}
                initial={{ opacity: 0, scale: 0.85, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -8 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "relative rounded-2xl p-3 shadow-sm border text-sm",
                  state === "correcting"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-stone-200 text-stone-700"
                )}
              >
                <p className="leading-relaxed">{speechText}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Robot avatar */}
        <motion.div
          className={cn("relative shrink-0", sizeClass)}
          animate={{ y: state === "idle" ? [0, -3, 0] : 0 }}
          transition={{
            duration: 3.5,
            repeat: state === "idle" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <div className={cn("absolute inset-0 rounded-full blur-2xl transition-colors duration-500", haloColor)} style={{ opacity: state === "idle" ? 0.4 : 0.7 }} />
          <svg viewBox="0 0 200 250" className="relative w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8ECEF" />
                <stop offset="50%" stopColor="#D5DBDF" />
                <stop offset="100%" stopColor="#B8C0C5" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5C4A3A" />
                <stop offset="100%" stopColor="#3D2F22" />
              </linearGradient>
              <linearGradient id="metalDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3A3F4A" />
                <stop offset="100%" stopColor="#1F232B" />
              </linearGradient>
              <linearGradient id="metalLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B7280" />
                <stop offset="100%" stopColor="#4B5563" />
              </linearGradient>
              <radialGradient id="eyeGlow">
                <stop offset="0%" stopColor={eyeGlow} stopOpacity="1" />
                <stop offset="60%" stopColor={eyeGlow} stopOpacity="0.8" />
                <stop offset="100%" stopColor={eyeGlow} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="irisGrad">
                <stop offset="0%" stopColor="#E0FFFF" />
                <stop offset="40%" stopColor={eyeGlow} />
                <stop offset="100%" stopColor="#0284C7" />
              </radialGradient>
              <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#2C303A" />
                <stop offset="100%" stopColor="#111318" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background */}
            <circle cx="100" cy="100" r="95" fill="url(#bgGrad)" />

            {/* Shoulders */}
            <path d="M 30 200 Q 25 180 35 170 L 70 175 L 75 210 L 40 215 Z" fill="url(#metalDark)" stroke="#1F232B" strokeWidth="1" />
            <path d="M 170 200 Q 175 180 165 170 L 130 175 L 125 210 L 160 215 Z" fill="url(#metalDark)" stroke="#1F232B" strokeWidth="1" />
            <path d="M 70 210 L 130 210 L 135 245 L 65 245 Z" fill="url(#metalLight)" stroke="#1F232B" strokeWidth="1" />
            <path d="M 100 215 L 100 240 M 85 220 L 100 230 L 115 220" stroke="#1F232B" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Glowing star emblem */}
            <motion.g animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} filter="url(#strongGlow)">
              <path d="M 155 195 L 158 188 L 161 195 L 168 197 L 161 199 L 158 206 L 155 199 L 148 197 Z" fill={eyeGlow} />
            </motion.g>

            {/* Neck (mechanical) */}
            <rect x="85" y="155" width="30" height="40" fill="url(#metalDark)" stroke="#1F232B" strokeWidth="1" />
            <rect x="83" y="160" width="34" height="6" fill="url(#metalLight)" rx="1" />
            <rect x="83" y="170" width="34" height="6" fill="url(#metalLight)" rx="1" />
            <rect x="83" y="180" width="34" height="6" fill="url(#metalLight)" rx="1" />
            <line x1="92" y1="158" x2="92" y2="195" stroke={eyeGlow} strokeWidth="1.5" opacity="0.7" filter="url(#softGlow)" />
            <line x1="108" y1="158" x2="108" y2="195" stroke={eyeGlow} strokeWidth="1.5" opacity="0.7" filter="url(#softGlow)" />

            {/* Head */}
            <ellipse cx="100" cy="90" rx="42" ry="52" fill="url(#skinGrad)" stroke="#A0AAB0" strokeWidth="0.5" />

            {/* Panel lines */}
            <line x1="100" y1="50" x2="100" y2="75" stroke="#A0AAB0" strokeWidth="0.8" opacity="0.6" />
            <path d="M 65 85 Q 60 100 65 120" stroke="#A0AAB0" strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M 135 85 Q 140 100 135 120" stroke="#A0AAB0" strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M 75 125 Q 100 135 125 125" stroke="#A0AAB0" strokeWidth="0.8" fill="none" opacity="0.5" />
            <circle cx="80" cy="80" r="0.8" fill="#7A8590" opacity="0.6" />
            <circle cx="120" cy="80" r="0.8" fill="#7A8590" opacity="0.6" />
            <circle cx="85" cy="100" r="0.6" fill="#7A8590" opacity="0.5" />
            <circle cx="115" cy="100" r="0.6" fill="#7A8590" opacity="0.5" />

            {/* Hair */}
            <path d="M 60 75 Q 58 50 75 45 Q 100 35 125 45 Q 142 50 140 75 Q 140 70 130 68 Q 120 55 100 55 Q 80 55 70 68 Q 60 70 60 75 Z" fill="url(#hairGrad)" />
            <path d="M 70 60 Q 75 55 80 58 M 85 52 Q 92 48 97 52 M 105 52 Q 112 48 118 52 M 122 58 Q 128 55 132 60" stroke="#3D2F22" strokeWidth="0.6" fill="none" opacity="0.7" />
            <circle cx="100" cy="48" r="2" fill="#1F232B" />
            <circle cx="100" cy="48" r="1" fill={eyeGlow} filter="url(#softGlow)" />

            {/* Eyebrows */}
            <motion.path
              d={state === "correcting" ? "M 78 80 Q 86 76 92 80" : state === "happy" ? "M 78 78 Q 86 74 92 78" : state === "thinking" ? "M 78 78 Q 86 75 92 78" : "M 78 80 Q 86 78 92 80"}
              stroke="#3D2F22" strokeWidth="2" fill="none" strokeLinecap="round"
            />
            <motion.path
              d={state === "correcting" ? "M 108 80 Q 114 76 122 80" : state === "happy" ? "M 108 78 Q 114 74 122 78" : state === "thinking" ? "M 108 78 Q 114 75 122 78" : "M 108 80 Q 114 78 122 80"}
              stroke="#3D2F22" strokeWidth="2" fill="none" strokeLinecap="round"
            />

            {/* Eyes (ice-blue glowing) */}
            <motion.circle cx="85" cy="92" r="12" fill="url(#eyeGlow)" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="115" cy="92" r="12" fill="url(#eyeGlow)" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
            <motion.ellipse cx="85" cy="92" rx="6" ry={blink ? 0.5 : 4} fill="#F0F4F8" />
            <motion.ellipse cx="115" cy="92" rx="6" ry={blink ? 0.5 : 4} fill="#F0F4F8" />
            {!blink && (
              <>
                <motion.circle cx="85" cy="92" r="3.5" fill="url(#irisGrad)" filter="url(#softGlow)" />
                <motion.circle cx="115" cy="92" r="3.5" fill="url(#irisGrad)" filter="url(#softGlow)" />
                <circle cx="85" cy="92" r="1.5" fill="#0F172A" />
                <circle cx="115" cy="92" r="1.5" fill="#0F172A" />
                <circle cx="86.5" cy="90.5" r="1" fill="#FFFFFF" />
                <circle cx="116.5" cy="90.5" r="1" fill="#FFFFFF" />
              </>
            )}

            {/* Nose */}
            <path d="M 100 100 Q 98 108 96 113 Q 98 116 100 116 Q 102 116 104 113 Q 102 108 100 100" fill="none" stroke="#A0AAB0" strokeWidth="0.8" opacity="0.5" />

            {/* Mouth (lip-sync) */}
            <motion.g
              animate={isSpeaking ? { scaleY: [1, 1.3, 0.8, 1.2, 1] } : { scaleY: 1 }}
              transition={isSpeaking ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" } : {}}
              style={{ transformOrigin: "100px 125px" }}
            >
              {getMouthShape(state, isSpeaking, mouthFrame)}
            </motion.g>

            {/* State indicators */}
            {state === "listening" && (
              <>
                <motion.circle cx="50" cy="92" r="3" fill="none" stroke={eyeGlow} strokeWidth="2" animate={{ r: [3, 12], opacity: [1, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <motion.circle cx="150" cy="92" r="3" fill="none" stroke={eyeGlow} strokeWidth="2" animate={{ r: [3, 12], opacity: [1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
              </>
            )}
            {state === "thinking" && (
              <motion.text x="145" y="55" fontSize="16" animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "150px 60px" }}>⚙️</motion.text>
            )}
            {state === "happy" && (
              <>
                <motion.text x="50" y="55" fontSize="14" animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.text>
                <motion.text x="140" y="65" fontSize="12" animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>⭐</motion.text>
              </>
            )}
            {state === "correcting" && (
              <motion.circle cx="100" cy="48" r="3" fill="#fbbf24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }} filter="url(#strongGlow)" />
            )}
          </svg>

          {/* Status badge */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-medium shadow-sm whitespace-nowrap"
            initial={false}
            animate={{ backgroundColor: state === "correcting" ? "rgb(254 243 199)" : state === "happy" ? "rgb(209 250 229)" : "rgb(243 244 246)" }}
          >
            <span className={cn(state === "correcting" ? "text-amber-700" : state === "happy" ? "text-emerald-700" : "text-stone-600")}>
              {getStatusLabel(state)}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function getMouthShape(state: AvatarState, isSpeaking: boolean, frame: number): React.ReactElement {
  if (isSpeaking) {
    const shapes = [
      <ellipse key="0" cx="100" cy="125" rx="8" ry="2" fill="#8B5A5A" />,
      <ellipse key="1" cx="100" cy="125" rx="7" ry="5" fill="#8B5A5A" />,
      <ellipse key="2" cx="100" cy="125" rx="9" ry="3" fill="#8B5A5A" />,
      <ellipse key="3" cx="100" cy="125" rx="7" ry="6" fill="#8B5A5A" />,
      <ellipse key="4" cx="100" cy="125" rx="8" ry="2" fill="#8B5A5A" />,
    ];
    return shapes[frame] ?? shapes[0];
  }
  switch (state) {
    case "happy": return <path d="M 88 122 Q 100 135 112 122 Q 100 130 88 122 Z" fill="#8B5A5A" />;
    case "correcting": return <path d="M 90 128 Q 100 122 110 128" stroke="#8B5A5A" strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "thinking": return <line x1="92" y1="125" x2="108" y2="125" stroke="#8B5A5A" strokeWidth="2" strokeLinecap="round" />;
    default: return <path d="M 90 124 Q 100 130 110 124" stroke="#8B5A5A" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}

function getStatusLabel(state: AvatarState): string {
  switch (state) {
    case "idle": return "Ready";
    case "listening": return "Listening…";
    case "thinking": return "Thinking…";
    case "speaking": return "Speaking…";
    case "correcting": return "Correcting…";
    case "happy": return "Great! 🎉";
    default: return "";
  }
}
