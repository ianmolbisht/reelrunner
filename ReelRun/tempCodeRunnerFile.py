from google import genai
from datetime import date
import random
import os
import edge_tts
import asyncio
import re
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("Set the GEMINI_API_KEY environment variable before running.")

client = genai.Client(api_key=api_key)


# Generate random past date
today = date.today()
random_number = random.randint(50, 400)
new_date = date(today.year - random_number, today.month, today.day)

print("Generated Date:", new_date)


# Prompt
prompt = f"""
Write a viral 30-second Instagram reel narration.

Topic:
A real historical fun event that happened on {new_date.strftime('%B %d')}

Requirements:
- Start with a shocking 1-sentence hook.
- Keep it story-based and cinematic.
- Keep total length under 110 words.
- End with a strong thought-provoking line.
- Do NOT invent fictional events.
- Output plain narration text only (no XML, no SSML, no markdown).
- Use conversational spoken English with contractions when natural.
- Keep sentence rhythm varied with a mix of short and medium sentences.
- Add natural pauses using punctuation like commas and ellipses.
- Avoid sounding like a textbook or Wikipedia summary.
"""

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

script = response.text.strip()

# Remove accidental markdown blocks if present
if script.startswith("```"):
    parts = script.split("```")
    if len(parts) >= 2:
        script = parts[1].strip()


def humanize_for_tts(text: str) -> str:
    # Normalize punctuation for smoother spoken pauses.
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = cleaned.replace(";", ",")
    cleaned = cleaned.replace(":", ",")
    cleaned = cleaned.replace(" - ", ", ")
    cleaned = cleaned.replace(" -- ", ", ")
    cleaned = cleaned.replace("(", ", ").replace(")", "")
    cleaned = re.sub(r",\s*,+", ", ", cleaned)
    cleaned = re.sub(r"\.{4,}", "...", cleaned)

    # Add a gentle pause after the opening hook when possible.
    if "." in cleaned:
        first, rest = cleaned.split(".", 1)
        if 5 <= len(first.split()) <= 14:
            cleaned = f"{first}... {rest.strip()}"

    return cleaned


script = humanize_for_tts(script)

print("\nGenerated Script:\n")
print(script)


# Generate voice file
async def generate_voice(text):
    communicate = edge_tts.Communicate(
        text=text,
        voice="en-US-AndrewNeural",
        rate="-10%",
        pitch="-2Hz",
        volume="+0%",
    )
    await communicate.save("voice.mp3")

asyncio.run(generate_voice(script))

print("\nVoice file saved as voice.mp3")

