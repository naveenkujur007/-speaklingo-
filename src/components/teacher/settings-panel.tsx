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
import { Sparkles, Globe2, GraduationCap, MessageSquare, Volume2, Gauge } from "lucide-react";

interface SettingsPanelProps {
  language: string;
  level: Difficulty;
  topic: string;
  autoSpeak: boolean;
  voice: string;
  ttsSpeed: number;
  onLanguageChange: (v: string) => void;
  onLevelChange: (v: Difficulty) => void;
  onTopicChange: (v: string) => void;
  onAutoSpeakChange: (v: boolean) => void;
  onVoiceChange: (v: string) => void;
  onTtsSpeedChange: (n: number) => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Lesson Setup
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" />
              Language to Learn
            </Label>
            <Select
              value={props.language}
              onValueChange={props.onLanguageChange}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="mr-1.5">{l.flag}</span>
                    {l.name}{" "}
                    <span className="text-stone-400 text-xs">({l.nativeName})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-stone-500">
              Multi-language ready. English is the default focus.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Your Level
            </Label>
            <Select
              value={props.level}
              onValueChange={(v) => props.onLevelChange(v as Difficulty)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    <div className="flex flex-col">
                      <span>{d.label}</span>
                      <span className="text-[10px] text-stone-400">
                        {d.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Conversation Topic
            </Label>
            <Select value={props.topic} onValueChange={props.onTopicChange}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    <div className="flex flex-col">
                      <span>{t.label}</span>
                      <span className="text-[10px] text-stone-400">
                        {t.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5 mb-3">
          <Volume2 className="h-4 w-4 text-emerald-500" />
          Teacher Voice
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-600">
              Voice Style
            </Label>
            <Select value={props.voice} onValueChange={props.onVoiceChange}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    <div className="flex flex-col">
                      <span>{v.label}</span>
                      <span className="text-[10px] text-stone-400">
                        {v.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-stone-500">
              Default: Lively (energetic). Pick Charismatic for more punch.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                Talking Speed
              </Label>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {(props.ttsSpeed ?? 1.15).toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[props.ttsSpeed ?? 1.15]}
              onValueChange={(vals) => props.onTtsSpeedChange(vals[0])}
              min={0.5}
              max={2.0}
              step={0.05}
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-xs font-medium text-stone-700">
                Auto-speak AI replies
              </Label>
              <p className="text-[11px] text-stone-500">
                Hear the teacher&apos;s reply out loud automatically.
              </p>
            </div>
            <Switch
              checked={props.autoSpeak}
              onCheckedChange={props.onAutoSpeakChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
