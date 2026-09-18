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

interface TalkingAvatarProps {
  state: AvatarState;
  /** Text the robot is currently speaking (shown in speech bubble) */
  speechText?: string;
  /** Whether the robot is actively producing audio (drives lip-sync) */
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

// Animated SVG robot avatar with lip-sync, expressions, and a speech bubble.
// State-driven:
// - idle: gentle float, occasional blink
// - listening: ears perk, eyes wide, sound waves
// - thinking: eyes look up, gears spin
// - speaking: mouth animates (lip-sync), friendly eyes
// - correcting: concerned expression, finger wag, amber glow
// - happy: big smile, sparkles, celebratory
export function TalkingAvatar({
  state,
  speechText,
  isSpeaking,
  size = "md",
}: TalkingAvatarProps) {
  const [blink, setBlink] = useState(false);

  // Random blink timer (every 2-5 seconds when idle/listening).
  useEffect(() => {
    if (state === "speaking" || state === "thinking") return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, [state]);

  const sizeClass = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-48 h-48",
  }[size];

  // Expression config per state
  const eyeShape = getEyeShape(state, blink);
  const mouthShape = getMouthShape(state, isSpeaking);
  const bodyColor = getBodyColor(state);
  const glowColor = getGlowColor(state);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar + speech bubble row */}
      <div className="flex items-end gap-3 w-full justify-center">
        {/* Speech bubble (left of avatar) */}
        <div className="flex-1 max-w-xs order-1">
          <AnimatePresence mode="wait">
            {speechText && (
              <motion.div
                key={speechText.slice(0, 30)}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative rounded-2xl p-3 shadow-sm border text-sm",
                  state === "correcting"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-stone-200 text-stone-700"
                )}
              >
                {/* Tail pointing right (toward avatar) */}
                <div
                  className={cn(
                    "absolute right-0 bottom-4 transform translate-x-full w-0 h-0",
                    "border-l-8 border-l-transparent border-r-0",
                    state === "correcting"
                      ? "border-t-8 border-t-amber-50"
                      : "border-t-8 border-t-white"
                  )}
                  style={{
                    filter: "drop-shadow(1px 0 0 rgba(0,0,0,0.05))",
                  }}
                />
                <p className="leading-relaxed">{speechText}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Robot avatar (right) */}
        <motion.div
          className={cn("relative shrink-0", sizeClass)}
          animate={{
            y: state === "idle" ? [0, -6, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: state === "idle" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Glow halo behind avatar */}
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl transition-colors duration-500",
              glowColor
            )}
            style={{ opacity: state === "idle" ? 0.3 : 0.6 }}
          />

          <svg
            viewBox="0 0 200 200"
            className="relative w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={bodyColor.light} />
                <stop offset="100%" stopColor={bodyColor.dark} />
              </linearGradient>
              <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f0fdf4" />
                <stop offset="100%" stopColor="#dcfce7" />
              </linearGradient>
              <radialGradient id="eyeGrad">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </radialGradient>
              <filter id="softShadow">
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="3"
                  floodOpacity="0.15"
                />
              </filter>
            </defs>

            {/* Antenna */}
            <motion.g
              animate={{
                rotate: state === "thinking" ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: state === "thinking" ? Infinity : 0,
              }}
              style={{ transformOrigin: "100px 30px" }}
            >
              <line
                x1="100"
                y1="30"
                x2="100"
                y2="55"
                stroke="#64748b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <motion.circle
                cx="100"
                cy="25"
                r="6"
                fill={glowColor.includes("amber") ? "#f59e0b" : "#10b981"}
                animate={{
                  opacity:
                    state === "listening" || state === "thinking"
                      ? [0.5, 1, 0.5]
                      : 1,
                }}
                transition={{
                  duration: 1,
                  repeat:
                    state === "listening" || state === "thinking"
                      ? Infinity
                      : 0,
                }}
              />
            </motion.g>

            {/* Robot head (rounded rect) */}
            <rect
              x="45"
              y="55"
              width="110"
              height="95"
              rx="20"
              fill="url(#bodyGrad)"
              filter="url(#softShadow)"
              stroke={bodyColor.dark}
              strokeWidth="2"
            />

            {/* Face screen */}
            <rect
              x="58"
              y="68"
              width="84"
              height="65"
              rx="12"
              fill="url(#screenGrad)"
              stroke="#86efac"
              strokeWidth="1.5"
            />

            {/* Eyes */}
            <g>
              {/* Left eye */}
              <motion.g
                animate={{
                  scaleY: blink ? 0.1 : 1,
                }}
                transition={{ duration: 0.1 }}
                style={{ transformOrigin: "82px 92px" }}
              >
                {eyeShape === "circle" && (
                  <circle cx="82" cy="92" r="7" fill="url(#eyeGrad)" />
                )}
                {eyeShape === "wide" && (
                  <>
                    <circle cx="82" cy="92" r="9" fill="url(#eyeGrad)" />
                    <circle cx="82" cy="92" r="4" fill="#064e3b" />
                  </>
                )}
                {eyeShape === "happy" && (
                  <path
                    d="M 75 92 Q 82 85 89 92"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
                {eyeShape === "thinking" && (
                  <>
                    <circle cx="82" cy="90" r="6" fill="url(#eyeGrad)" />
                    <circle cx="84" cy="88" r="2" fill="#064e3b" />
                  </>
                )}
                {eyeShape === "concerned" && (
                  <>
                    <circle cx="82" cy="92" r="6" fill="url(#eyeGrad)" />
                    <line
                      x1="73"
                      y1="86"
                      x2="91"
                      y2="90"
                      stroke="#064e3b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </motion.g>

              {/* Right eye */}
              <motion.g
                animate={{
                  scaleY: blink ? 0.1 : 1,
                }}
                transition={{ duration: 0.1 }}
                style={{ transformOrigin: "118px 92px" }}
              >
                {eyeShape === "circle" && (
                  <circle cx="118" cy="92" r="7" fill="url(#eyeGrad)" />
                )}
                {eyeShape === "wide" && (
                  <>
                    <circle cx="118" cy="92" r="9" fill="url(#eyeGrad)" />
                    <circle cx="118" cy="92" r="4" fill="#064e3b" />
                  </>
                )}
                {eyeShape === "happy" && (
                  <path
                    d="M 111 92 Q 118 85 125 92"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
                {eyeShape === "thinking" && (
                  <>
                    <circle cx="118" cy="90" r="6" fill="url(#eyeGrad)" />
                    <circle cx="120" cy="88" r="2" fill="#064e3b" />
                  </>
                )}
                {eyeShape === "concerned" && (
                  <>
                    <circle cx="118" cy="92" r="6" fill="url(#eyeGrad)" />
                    <line
                      x1="127"
                      y1="86"
                      x2="109"
                      y2="90"
                      stroke="#064e3b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </motion.g>
            </g>

            {/* Mouth (lip-sync) */}
            <motion.g
              animate={
                isSpeaking
                  ? {
                      scaleY: [1, 1.4, 0.8, 1.3, 1],
                    }
                  : {}
              }
              transition={
                isSpeaking
                  ? {
                      duration: 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {}
              }
              style={{ transformOrigin: "100px 118px" }}
            >
              {mouthShape === "smile" && (
                <path
                  d="M 88 118 Q 100 128 112 118"
                  stroke="#059669"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
              {mouthShape === "talking" && (
                <ellipse
                  cx="100"
                  cy="120"
                  rx="10"
                  ry="6"
                  fill="#059669"
                />
              )}
              {mouthShape === "big-smile" && (
                <path
                  d="M 84 116 Q 100 134 116 116 Q 100 128 84 116 Z"
                  fill="#059669"
                />
              )}
              {mouthShape === "neutral" && (
                <line
                  x1="90"
                  y1="120"
                  x2="110"
                  y2="120"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {mouthShape === "concerned" && (
                <path
                  d="M 88 124 Q 100 116 112 124"
                  stroke="#059669"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </motion.g>

            {/* Side ears (speaker grilles) */}
            <g>
              <rect
                x="38"
                y="85"
                width="10"
                height="25"
                rx="5"
                fill={bodyColor.dark}
              />
              <rect
                x="152"
                y="85"
                width="10"
                height="25"
                rx="5"
                fill={bodyColor.dark}
              />
              {/* Sound waves when listening */}
              {state === "listening" && (
                <>
                  <motion.circle
                    cx="33"
                    cy="97"
                    r="3"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    animate={{ r: [3, 10], opacity: [1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                  <motion.circle
                    cx="167"
                    cy="97"
                    r="3"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    animate={{ r: [3, 10], opacity: [1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: 0.3,
                    }}
                  />
                </>
              )}
            </g>

            {/* Neck */}
            <rect
              x="90"
              y="148"
              width="20"
              height="12"
              fill={bodyColor.dark}
              rx="3"
            />

            {/* Shoulders/body hint */}
            <path
              d="M 60 165 Q 100 175 140 165 L 140 200 L 60 200 Z"
              fill={bodyColor.light}
              opacity="0.6"
            />

            {/* Sparkles when happy */}
            {state === "happy" && (
              <>
                <motion.text
                  x="40"
                  y="50"
                  fontSize="20"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.text>
                <motion.text
                  x="155"
                  y="60"
                  fontSize="16"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                >
                  ⭐
                </motion.text>
              </>
            )}

            {/* "Thinking" gears */}
            {state === "thinking" && (
              <>
                <motion.text
                  x="130"
                  y="45"
                  fontSize="18"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ transformOrigin: "135px 45px" }}
                >
                  ⚙️
                </motion.text>
              </>
            )}
          </svg>
        </motion.div>
      </div>

      {/* Status label below avatar */}
      <div className="text-center">
        <p
          className={cn(
            "text-xs font-medium",
            state === "correcting"
              ? "text-amber-600"
              : "text-stone-500"
          )}
        >
          {getStatusLabel(state)}
        </p>
      </div>
    </div>
  );
}

// ---- Helpers ----

function getEyeShape(
  state: AvatarState,
  blink: boolean
): "circle" | "wide" | "happy" | "thinking" | "concerned" {
  if (blink) return "circle";
  switch (state) {
    case "listening":
      return "wide";
    case "thinking":
      return "thinking";
    case "happy":
      return "happy";
    case "correcting":
      return "concerned";
    default:
      return "circle";
  }
}

function getMouthShape(
  state: AvatarState,
  isSpeaking?: boolean
): "smile" | "talking" | "big-smile" | "neutral" | "concerned" {
  if (isSpeaking) return "talking";
  switch (state) {
    case "speaking":
      return "talking";
    case "happy":
      return "big-smile";
    case "correcting":
      return "concerned";
    case "thinking":
      return "neutral";
    default:
      return "smile";
  }
}

function getBodyColor(state: AvatarState): { light: string; dark: string } {
  switch (state) {
    case "correcting":
      return { light: "#fef3c7", dark: "#f59e0b" }; // amber
    case "happy":
      return { light: "#d1fae5", dark: "#10b981" }; // emerald bright
    case "listening":
      return { light: "#dbeafe", dark: "#3b82f6" }; // blue
    case "thinking":
      return { light: "#ede9fe", dark: "#8b5cf6" }; // violet
    default:
      return { light: "#e0f2fe", dark: "#0ea5e9" }; // sky
  }
}

function getGlowColor(state: AvatarState): string {
  switch (state) {
    case "correcting":
      return "bg-amber-400";
    case "happy":
      return "bg-emerald-400";
    case "listening":
      return "bg-blue-400";
    case "thinking":
      return "bg-violet-400";
    default:
      return "bg-sky-400";
  }
}

function getStatusLabel(state: AvatarState): string {
  switch (state) {
    case "idle":
      return "Ready to chat";
    case "listening":
      return "Listening…";
    case "thinking":
      return "Thinking…";
    case "speaking":
      return "Speaking…";
    case "correcting":
      return "Correcting your mistake";
    case "happy":
      return "Great job! 🎉";
    default:
      return "";
  }
}
