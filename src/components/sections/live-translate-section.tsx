"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Loader2, Volume2, ArrowDown, Languages, Sparkles, DollarSign, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { useToast } from "@/hooks/use-toast";
import { speakText } from "@/lib/speak";
import { LANGUAGES } from "@/lib/teacher-config";

export function LiveTranslateSection() {
  const app = useAppStore();
  const { toast } = useToast();
  const [sourceLang, setSourceLang] = useState<string>("hindi");
  const [targetLang, setTargetLang] = useState<string>(app.language || "english");
  const [input, setInput] = useState("");
  const [translating, setTranslating] = useState(false);
  const [result, setResult] = useState<{ translation: string; meaning: string; note: string | null } | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const targetLanguageInfo = LANGUAGES.find((l) => l.code === targetLang);
  const sourceLanguageInfo = LANGUAGES.find((l) => l.code === sourceLang);

  const handleVoiceInput = async () => {
    if (recording || transcribing) return;
    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false); setTranscribing(true);
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const fd = new FormData();
        const ext = blob.type.includes("webm") ? "webm" : "wav";
        fd.append("audio", blob, `recording.${ext}`);
        try {
          const res = await fetch("/api/asr", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) { setInput(data.text.trim()); toast({ title: "Heard!", description: data.text.slice(0, 80) }); }
          else toast({ title: "Couldn't hear clearly", variant: "destructive" });
        } catch { toast({ title: "Voice input failed", variant: "destructive" }); }
        finally { setTranscribing(false); }
      };
      recorder.start(); setTimeout(() => recorder.stop(), 5000);
    } catch { setRecording(false); toast({ title: "Microphone access denied", variant: "destructive" }); }
  };

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setTranslating(true); setResult(null);
    try {
      const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, from: sourceLang, to: targetLang }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setResult({ translation: data.translation || "", meaning: data.meaning || "", note: data.note || null });
    } catch (e) { toast({ title: "Translation failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }); }
    finally { setTranslating(false); }
  };

  const handleSpeak = async (text: string) => { if (text) await speakText(text); };
  const swap = () => { setSourceLang(targetLang); setTargetLang(sourceLang); if (result) { setInput(result.translation); setResult(null); } };

  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 bg-gradient-to-br from-violet-500 to-indigo-500 text-white border-0 shadow-md">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          <div><h1 className="text-lg font-bold">Live Translate & Learn</h1>
          <p className="text-xs text-violet-50">Speak or type in your language → see meaning in the language you&apos;re learning</p></div>
        </div>
      </Card>
      <Card className="p-4 bg-white space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-600">You speak</Label>
            <Select value={sourceLang} onValueChange={setSourceLang}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}><span className="mr-2">{l.flag}</span>{l.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button variant="outline" size="icon" onClick={swap} className="mb-0.5"><ArrowDown className="h-4 w-4" /></Button>
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-600">You learn</Label>
            <Select value={targetLang} onValueChange={setTargetLang}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}><span className="mr-2">{l.flag}</span>{l.name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-white space-y-3">
        <div className="flex items-start gap-3">
          <button type="button" onClick={handleVoiceInput} disabled={recording || transcribing || translating}
            className={cn("flex h-12 w-12 items-center justify-center rounded-full shrink-0 transition-all shadow-md", recording ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500 text-white hover:bg-emerald-600")}>
            {transcribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Type or speak in ${sourceLanguageInfo?.name ?? "your language"}...`} rows={3}
            className="flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm focus:border-emerald-400 focus:outline-none" disabled={translating} />
        </div>
        <Button onClick={handleTranslate} disabled={!input.trim() || translating} className="w-full bg-violet-600 hover:bg-violet-700 text-white" size="lg">
          {translating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Translating...</> : <><Sparkles className="h-4 w-4 mr-1" /> Translate & Show Meaning</>}
        </Button>
      </Card>
      {result && (
        <div className="space-y-3">
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><span className="text-base">{targetLanguageInfo?.flag}</span><span className="text-xs font-medium text-stone-600">In {targetLanguageInfo?.name}</span></div>
              <button type="button" onClick={() => handleSpeak(result.translation)} className="text-stone-400 hover:text-emerald-600"><Volume2 className="h-5 w-5" /></button>
            </div>
            <p className="text-lg font-medium text-stone-800 leading-relaxed">{result.translation}</p>
          </Card>
          {result.meaning && (
            <Card className="p-4 bg-gradient-to-br from-sky-50 to-white border-sky-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><span className="text-base">{sourceLanguageInfo?.flag}</span><span className="text-xs font-medium text-stone-600">Meaning in {sourceLanguageInfo?.name}</span></div>
                <button type="button" onClick={() => handleSpeak(result.meaning)} className="text-stone-400 hover:text-emerald-600"><Volume2 className="h-5 w-5" /></button>
              </div>
              <p className="text-base text-stone-700 leading-relaxed">{result.meaning}</p>
            </Card>
          )}
          {result.note && <Card className="p-3 bg-violet-50 border-violet-200"><p className="text-xs text-stone-600">💡 {result.note}</p></Card>}
        </div>
      )}
      {!result && (
        <div className="text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mx-auto mb-3"><Languages className="h-7 w-7" /></div>
          <p className="text-sm text-stone-500 max-w-md mx-auto">Speak or type in your language, then see the meaning in the language you&apos;re learning.</p>
        </div>
      )}
    </div>
  );
}
