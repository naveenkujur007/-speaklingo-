"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  LANGUAGES,
  TOPICS,
  DIFFICULTIES,
  VOICES,
  type Difficulty,
} from "@/lib/teacher-config";
import {
  HINT_LANGUAGES,
  type HintLanguage,
} from "@/lib/pricing";
import {
  Sparkles, Globe2, GraduationCap, MessageSquare,
  Volume2, Gauge, Headphones, Cloud, Languages,
} from "lucide-react";
import { useBrowserVoices } from "@/hooks/use-native-tts";
import type { TTSEngine } from "@/hooks/use-app-store";

interface SettingsPanelProps {
  language: string;
  level: Difficulty;
  topic: string;
  autoSpeak: boolean;
  voice: string;
  ttsSpeed: number;
  ttsEngine: TTSEngine;
  nativeVoiceURI: string | null;
  hintLanguage: HintLanguage;
  onLanguageChange: (v: string) => void;
  onLevelChange: (v: Difficulty) => void;
  onTopicChange: (v: string) => void;
  onAutoSpeakChange: (v: boolean) => void;
  onVoiceChange: (v: string) => void;
  onTtsSpeedChange: (n: number) => void;
  onTtsEngineChange: (e: TTSEngine) => void;
  onNativeVoiceURIChange: (uri: string | null) => void;
  onHintLanguageChange: (l: HintLanguage) => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const { voices: browserVoices, loaded: browserVoicesLoaded } = useBrowserVoices();

  const langCodeMap: Record<string, string> = {
    english: "en", hindi: "hi", spanish: "es", french: "fr",
    german: "de", japanese: "ja", chinese: "zh", arabic: "ar",
  };
  const targetLangPrefix = langCodeMap[props.language] ?? "en";

  const sortedBrowserVoices = [...browserVoices].sort((a, b) => {
    const aMatch = a.lang.toLowerCase().startsWith(targetLangPrefix) ? 0 : 1;
    const bMatch = b.lang.toLowerCase().startsWith(targetLangPrefix) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Lesson Setup
        </h2>
        <div className="space-y-4">
          {/* Language to Learn - WITH FLAGS */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" />
              Language to Learn
            </Label>
            <Select value={props.language} onValueChange={props.onLanguageChange}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="mr-2 text-base">{l.flag}</span>
                    <span className="font-medium">{l.name}</span>
                    <span className="text-stone-400 text-xs ml-1">({l.nativeName})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-stone-500">
              8 languages supported with full A1-C2 curricula.
            </p>
          </div>

          {/* Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Your Level
            </Label>
            <Select value={props.level} onValueChange={(v) => props.onLevelChange(v as Difficulty)}>
              <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    <div className="flex flex-col">
                      <span>{d.label}</span>
                      <span className="text-[10px] text-stone-400">{d.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Conversation Topic
            </Label>
            <Select value={props.topic} onValueChange={props.onTopicChange}>
              <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    <div className="flex flex-col">
                      <span>{t.label}</span>
                      <span className="text-[10px] text-stone-400">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Explanation Language (Hint Language) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              Explanations In
            </Label>
            <Select
              value={props.hintLanguage}
              onValueChange={(v) => props.onHintLanguageChange(v as HintLanguage)}
            >
              <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HINT_LANGUAGES.map((h) => (
                  <SelectItem key={h.code} value={h.code}>
                    <span className="mr-2">{h.flag}</span>
                    <span className="font-medium">{h.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-stone-500">
              Meanings & explanations in your native language. Auto-detected from your country.
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Voice */}
      <div className="border-t border-stone-200 pt-4">
        <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5 mb-3">
          <Volume2 className="h-4 w-4 text-emerald-500" />
          Teacher Voice
        </h2>

        {/* Voice Engine toggle */}
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium text-stone-600">Voice Engine</Label>
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => props.onTtsEngineChange("native")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                props.ttsEngine === "native" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              Native (Google/Microsoft)
            </button>
            <button
              type="button"
              onClick={() => props.onTtsEngineChange("ai")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                props.ttsEngine === "ai" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              Cloud AI
            </button>
          </div>
        </div>

        {/* Voice selector per engine */}
        {props.ttsEngine === "native" ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600">Browser Voice (by region)</Label>
            {!browserVoicesLoaded ? (
              <p className="text-[11px] text-stone-500 italic">Loading available voices…</p>
            ) : sortedBrowserVoices.length === 0 ? (
              <p className="text-[11px] text-amber-600">No native voices found. Try Chrome or Edge.</p>
            ) : (
              <Select
                value={props.nativeVoiceURI ?? "__default__"}
                onValueChange={(v) => props.onNativeVoiceURIChange(v === "__default__" ? null : v)}
              >
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">
                    <div className="flex flex-col">
                      <span>Browser default</span>
                      <span className="text-[10px] text-stone-400">Let the OS pick the best voice</span>
                    </div>
                  </SelectItem>
                  {sortedBrowserVoices.map((v) => (
                    <SelectItem key={v.uri} value={v.uri}>
                      <div className="flex flex-col">
                        <span>{v.name} <span className="text-[10px] text-stone-400">({v.lang})</span></span>
                        <span className="text-[10px] text-stone-400">
                          {v.localService ? "On-device" : "Network"}{v.default ? " · default" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600">AI Voice Style</Label>
            <Select value={props.voice} onValueChange={props.onVoiceChange}>
              <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    <div className="flex flex-col">
                      <span>{v.label}</span>
                      <span className="text-[10px] text-stone-400">{v.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Speed */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> Talking Speed
            </Label>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {(props.ttsSpeed ?? 1.0).toFixed(2)}x
            </span>
          </div>
          <Slider
            value={[props.ttsSpeed ?? 1.0]}
            onValueChange={(vals) => props.onTtsSpeedChange(vals[0])}
            min={0.5} max={2.0} step={0.05}
          />
        </div>

        {/* Auto-speak */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div>
            <Label className="text-xs font-medium text-stone-700">Auto-speak AI replies</Label>
            <p className="text-[11px] text-stone-500">Hear the teacher&apos;s reply out loud automatically.</p>
          </div>
          <Switch checked={props.autoSpeak} onCheckedChange={props.onAutoSpeakChange} />
        </div>
      </div>
    </div>
  );
}
