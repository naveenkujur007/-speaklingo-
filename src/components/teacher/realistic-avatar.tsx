"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "correcting"
  | "happy";

interface RealisticAvatarProps {
  state: AvatarState;
  speechText?: string;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

// Realistic human avatar using DiceBear's "micah" style — a detailed,
// illustration-based human face that looks much more real than a cartoon
// robot. We overlay animated elements (mouth, expressions, glow) on top
// of the static SVG to simulate a talking teacher.
//
// Lip-sync: when `isSpeaking` is true, an animated mouth overlay pulses
// on top of the avatar's mouth area to simulate talking.

const AVATAR_SEED = "LinguaBotTeacher";

export function RealisticAvatar({
  state,
  speechText,
  isSpeaking,
  size = "md",
}: RealisticAvatarProps) {
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  // Lip-sync: cycle through mouth shapes when speaking.
  useEffect(() => {
    if (!isSpeaking) {
      queueMicrotask(() => setMouthFrame(0));
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((f) => (f + 1) % 5);
    }, 120);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Blink animation
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3500;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  const sizeClass = {
    sm: "w-28 h-28",
    md: "w-44 h-44",
    lg: "w-56 h-56",
  }[size];

  const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${AVATAR_SEED}&backgroundColor=transparent&radius=50`;

  // Glow color per state
  const glowClass = {
    idle: "bg-sky-300/40",
    listening: "bg-blue-400/50",
    thinking: "bg-violet-400/50",
    speaking: "bg-emerald-400/50",
    correcting: "bg-amber-400/50",
    happy: "bg-emerald-400/60",
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
                <p className="leading-relaxed">{speechText}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <motion.div
          className={cn("relative shrink-0", sizeClass)}
          animate={{
            y: state === "idle" ? [0, -4, 0] : 0,
            rotate: state === "thinking" ? [0, 1, -1, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: state === "idle" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Glow halo */}
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl transition-colors duration-500",
              glowClass
            )}
            style={{ opacity: state === "idle" ? 0.4 : 0.7 }}
          />

          {/* Avatar container with circular crop */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-sky-50 to-emerald-50 border-4 border-white shadow-lg">
            {/* DiceBear human avatar */}
            {!avatarLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full"
                />
              </div>
            )}
            <img
              src={avatarUrl}
              alt="LinguaBot Teacher"
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                avatarLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setAvatarLoaded(true)}
            />

            {/* Blink overlay - dark line over eyes */}
            {blink && avatarLoaded && (
              <div className="absolute inset-0 flex items-start justify-center pt-[38%]">
                <div className="w-[60%] h-[3px] bg-stone-800/60 rounded-full" />
              </div>
            )}

            {/* Lip-sync mouth overlay */}
            {isSpeaking && avatarLoaded && (
              <div className="absolute inset-0 flex items-start justify-center pt-[52%]">
                <motion.div
                  key={mouthFrame}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  {/* Animated mouth shapes - cycles through 5 frames */}
                  {mouthFrame === 0 && (
                    <div className="w-6 h-2 bg-rose-700/80 rounded-full" />
                  )}
                  {mouthFrame === 1 && (
                    <div className="w-5 h-4 bg-rose-700/80 rounded-full" />
                  )}
                  {mouthFrame === 2 && (
                    <div className="w-7 h-3 bg-rose-700/80 rounded-full" />
                  )}
                  {mouthFrame === 3 && (
                    <div className="w-5 h-5 bg-rose-700/80 rounded-full" />
                  )}
                  {mouthFrame === 4 && (
                    <div className="w-6 h-2 bg-rose-700/80 rounded-full" />
                  )}
                </motion.div>
              </div>
            )}

            {/* Expression overlay - concerned (correcting) */}
            {state === "correcting" && avatarLoaded && (
              <div className="absolute top-[30%] left-0 right-0 flex justify-center gap-6">
                <div className="w-4 h-[2px] bg-stone-800/70 rotate-[15deg]" />
                <div className="w-4 h-[2px] bg-stone-800/70 -rotate-[15deg]" />
              </div>
            )}

            {/* Expression overlay - happy sparkles */}
            {state === "happy" && avatarLoaded && (
              <>
                <motion.div
                  className="absolute top-2 right-2 text-lg"
                  animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute top-4 left-2 text-sm"
                  animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.5,
                  }}
                >
                  ⭐
                </motion.div>
              </>
            )}

            {/* Thinking indicator - gears */}
            {state === "thinking" && avatarLoaded && (
              <motion.div
                className="absolute top-1 right-1 text-lg"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                ⚙️
              </motion.div>
            )}

            {/* Listening indicator - sound waves */}
            {state === "listening" && avatarLoaded && (
              <>
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 2], opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 2], opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </div>

          {/* Status badge below avatar */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm whitespace-nowrap"
            initial={false}
            animate={{
              backgroundColor:
                state === "correcting"
                  ? "rgb(254 243 199)"
                  : "rgb(243 244 246)",
            }}
          >
            <span
              className={cn(
                state === "correcting" ? "text-amber-700" : "text-stone-600"
              )}
            >
              {getStatusLabel(state)}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function getStatusLabel(state: AvatarState): string {
  switch (state) {
    case "idle":
      return "Ready";
    case "listening":
      return "Listening…";
    case "thinking":
      return "Thinking…";
    case "speaking":
      return "Speaking…";
    case "correcting":
      return "Correcting…";
    case "happy":
      return "Great! 🎉";
    default:
      return "";
  }
}
