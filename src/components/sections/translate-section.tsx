"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowLeftRight,
  Volume2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";
import { LANGUAGES } from "@/lib/teacher-config";

export function TranslateSection() {
  const { language, voice, ttsSpeed } = useAppStore();
  const [from, setFrom] = useState<string>(language);
  const [to, setTo] = useState<string>("hindi");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    translation: string;
    note: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setResult({ translation: data.translation, note: data.note ?? null });
    } catch (e) {
      setResult({
        translation: "Couldn't translate. Please try again.",
        note: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: ttsSpeed }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      await new Audio(URL.createObjectURL(blob)).play();
    } catch {
      // ignore
    } finally {
      setSpeaking(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (result) {
      setInput(result.translation);
      setResult(null);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-md">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-bold">Translator</h1>
            <p className="text-xs text-violet-50">
              Translate any phrase. Hear pronunciation. Learn usage notes.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white space-y-4">
        {/* From / To selectors */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-600">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="mb-0.5"
            aria-label="Swap languages"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-600">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-stone-600">Type or paste text</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what you want to translate..."
            rows={3}
            className="resize-none bg-stone-50"
          />
        </div>

        <Button
          onClick={handleTranslate}
          disabled={!input.trim() || loading}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Translate
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-violet-700 uppercase tracking-wide">
              Translation
            </Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => speak(result.translation)}
                className="text-stone-400 hover:text-violet-600 p-1"
                aria-label="Hear translation"
              >
                {speaking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={copyResult}
                className="text-stone-400 hover:text-violet-600 p-1"
                aria-label="Copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-base text-stone-800 font-medium">
            {result.translation}
          </p>
          {result.note && (
            <div className="text-xs text-stone-600 bg-violet-100/60 rounded p-2">
              💡 {result.note}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
