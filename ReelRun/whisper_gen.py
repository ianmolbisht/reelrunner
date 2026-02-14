from faster_whisper import WhisperModel

audio_path = "voice.mp3"

# tiny = fast + light
model = WhisperModel("tiny", device="cpu", compute_type="int8")

segments, _ = model.transcribe(
    audio_path,
    word_timestamps=True
)

words_data = []

for segment in segments:
    for w in segment.words:
        words_data.append((w.start, w.end, w.word.strip()))

# save timestamps
with open("timestamps.txt", "w", encoding="utf-8") as f:
    for s,e,w in words_data:
        f.write(f"{s:.2f}|{e:.2f}|{w}\n")

print("✅ Timestamps saved to timestamps.txt")
