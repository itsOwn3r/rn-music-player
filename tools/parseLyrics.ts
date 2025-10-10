export type LyricLine = { time: number; text: string };

export function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (match) {
      const [, min, sec, text] = match;
      const time = parseInt(min) * 60 + parseFloat(sec);
      parsed.push({ time, text: text.trim() });
    }
  }

  // 🧩 Fallback for plain text (no timestamps)
  if (parsed.length === 0) {
    return lines.map((text, i) => ({
      time: 0, // fake spacing (5 sec apart)
      text,
    }));
  }

  return parsed.sort((a, b) => a.time - b.time);
}
