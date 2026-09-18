import { NextRequest, NextResponse } from "next/server";

// GET /api/tts-proxy?text=Hello+world&lang=en
// Proxies Google Translate TTS to get professional adult English voice.
// This bypasses CORS restrictions — server fetches from Google, returns MP3.
// No API key needed. Free. Professional adult male/female voice.
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  if (!text.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  // Google Translate TTS has a ~200 char limit per request.
  // For longer text, we'd need to split — but for chat replies it's usually fine.
  const truncated = text.slice(0, 200);

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(truncated)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "audio/mpeg, audio/*",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "TTS service unavailable" },
        { status: 502 }
      );
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("TTS proxy error:", err);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
