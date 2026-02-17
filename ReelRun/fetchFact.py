from google import genai
from datetime import date
import random
import os
import edge_tts
import asyncio
import re
from dotenv import load_dotenv

# ---------------------------
# LOAD ENV
# ---------------------------

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("Set GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

# ---------------------------
# RANDOM DATE (optional)
# ---------------------------

today = date.today()
random_number = random.randint(50, 400)
new_date = date(today.year - random_number, today.month, today.day)

print("Generated Date:", new_date)

# ---------------------------
# STRONG REEL PROMPT
# ---------------------------

prompt = """
Generate 5 short viral space facts for an Instagram reel.

Rules:
- 30 seconds time
- Mind-blowing and real
- Easy to understand
- 1–2 lines each
- Conversational tone
- No numbering
- No titles
- No emojis
- Plain text only
- Each fact on a new line
"""


print("\nUsing Prompt:\n", prompt)

# ---------------------------
# GENERATE STORY
# ---------------------------

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

script = response.text.strip()

# ---------------------------
# CLEAN OUTPUT
# ---------------------------

script = re.sub(r"\*+", "", script)
script = re.sub(r"\[.*?\]", "", script)
script = re.sub(r"\(.*?\)", "", script)
script = re.sub(r"\s+", " ", script).strip()

# ---------------------------
# HUMANIZE FOR TTS
# ---------------------------

def humanize_for_tts(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = cleaned.replace(";", ",")
    cleaned = cleaned.replace(":", ",")
    cleaned = cleaned.replace(" - ", ", ")
    cleaned = cleaned.replace(" -- ", ", ")
    cleaned = re.sub(r",\s*,+", ", ", cleaned)
    cleaned = re.sub(r"\.{4,}", "...", cleaned)

    if "." in cleaned:
        first, rest = cleaned.split(".", 1)
        if 6 <= len(first.split()) <= 14:
            cleaned = f"{first}... {rest.strip()}"

    return cleaned

script = humanize_for_tts(script)

print("\nGenerated Reel Story:\n")
print(script)

# ---------------------------
# TEXT TO SPEECH
# ---------------------------

async def generate_voice(text):
    communicate = edge_tts.Communicate(
        text=text,
        voice="en-US-AndrewNeural",
        rate="+10%",
        pitch="+2Hz",
    )
    await communicate.save("voice.mp3")

asyncio.run(generate_voice(script))

print("\n✅ voice.mp3 ready")
