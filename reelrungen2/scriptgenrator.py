"""
Script and Voice Generator
Uses Gemini API for script generation and edge-tts for voiceover
"""

import os
import re
import asyncio
import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import date
import random
from dotenv import load_dotenv

try:
    from google import genai
    import edge_tts
except ImportError:
    print("⚠️  Install required packages: pip install google-generativeai edge-tts --break-system-packages")
    raise

load_dotenv()

# API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Set GEMINI_API_KEY environment variable")

client = genai.Client(api_key=GEMINI_API_KEY)


async def generate_script_and_voice(
    topic: str = "random",
    tone: str = "humorous",
    duration: int = 30
) -> Optional[Dict[str, Any]]:
    """
    Generate script, voiceover, and timestamps
    
    Args:
        topic: Topic for the reel (or "random" for AI to choose)
        tone: Tone of the script (humorous, serious, inspiring, etc.)
        duration: Target duration in seconds
    
    Returns:
        Dictionary with script, voice_path, timestamps, and metadata
    """
    
    print(f"📝 Generating {tone} script about: {topic}")
    
    # Generate script
    script = generate_script(topic, tone, duration)
    if not script:
        return None
    
    print(f"✅ Script generated ({len(script.split())} words)")
    
    # Generate visual prompt for AI image generation
    video_prompt = generate_video_prompt(script, tone)
    
    # Generate voiceover
    voice_path = await generate_voice(script, tone)
    if not voice_path:
        return None
    
    print(f"✅ Voiceover generated: {voice_path}")
    
    # Generate timestamps for word-by-word captions
    timestamps = generate_timestamps(script)
    
    # Save timestamps to file
    save_timestamps(timestamps)
    
    # Calculate actual duration from voice
    audio_duration = await get_audio_duration(voice_path)
    
    return {
        "script": script,
        "voice_path": str(voice_path),
        "timestamps": timestamps,
        "video_prompt": video_prompt,
        "duration": audio_duration or duration,
        "topic": topic,
        "tone": tone
    }


def generate_script(topic: str, tone: str, duration: int) -> Optional[str]:
    """Generate viral script using Gemini"""
    
    # Create prompt based on topic
    if topic == "random":
        topic_instruction = "Choose a fascinating, funny, or mind-blowing event/fact from India"
    else:
        topic_instruction = f"Write about: {topic}"
    
    # Adjust word count based on duration (roughly 2.5 words per second)
    max_words = int(duration * 2.5)
    
    prompt = f"""
Write a viral {duration}-second Instagram reel narration.

Topic:
{topic_instruction}

Tone: {tone}

Requirements:
- Start with a shocking or attention-grabbing 1-sentence hook
- Must be TRUE and verifiable (no fictional stories)
- Mix {tone} tone with curiosity and engagement
- Maximum {max_words} words
- End with a strong call-to-action or thought-provoking statement
- Use conversational spoken English
- Natural pauses using commas and ellipses
- Short sentences for easy captioning
- NO markdown, NO formatting, plain text only
- Make it shareable and memorable

Format: Just the narration script, nothing else.
"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        script = response.text.strip()
        
        # Clean up any markdown
        if script.startswith("```"):
            parts = script.split("```")
            if len(parts) >= 2:
                script = parts[1].strip()
        
        # Humanize for better TTS
        script = humanize_for_tts(script)
        
        return script
        
    except Exception as e:
        print(f"❌ Error generating script: {e}")
        return None


def generate_video_prompt(script: str, tone: str) -> str:
    """Generate a video prompt based on the script"""
    
    # Extract key visual elements from script
    try:
        prompt = f"""
Based on this script, create a short visual description for a background video:

Script: {script}

Generate a 1-sentence description of what visuals would complement this narration.
Focus on: mood, setting, movement, colors.
Style: {tone}, engaging, professional.
Format: Just the description, nothing else.
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        video_prompt = response.text.strip()
        return video_prompt
        
    except:
        # Fallback generic prompt
        return f"Cinematic {tone} visuals with dynamic movement and engaging composition"


def humanize_for_tts(text: str) -> str:
    """Make text more natural for text-to-speech"""
    
    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", text).strip()
    
    # Normalize punctuation for smoother pauses
    cleaned = cleaned.replace(";", ",")
    cleaned = cleaned.replace(":", ",")
    cleaned = cleaned.replace(" - ", ", ")
    cleaned = cleaned.replace(" -- ", ", ")
    cleaned = cleaned.replace("(", ", ").replace(")", "")
    
    # Remove duplicate commas
    cleaned = re.sub(r",\s*,+", ", ", cleaned)
    
    # Normalize ellipses
    cleaned = re.sub(r"\.{4,}", "...", cleaned)
    
    # Add pause after opening hook
    if "." in cleaned:
        first, rest = cleaned.split(".", 1)
        if 5 <= len(first.split()) <= 14:
            cleaned = f"{first}... {rest.strip()}"
    
    return cleaned


async def generate_voice(
    script: str,
    tone: str
) -> Optional[Path]:
    """Generate voiceover using edge-tts"""
    
    output_dir = Path("output/audio")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    voice_path = output_dir / "voice.mp3"
    
    # Select voice based on tone
    voice_map = {
        "humorous": "en-US-GuyNeural",
        "serious": "en-US-AndrewNeural",
        "inspiring": "en-US-JennyNeural",
        "casual": "en-US-ChristopherNeural",
        "energetic": "en-US-EricNeural"
    }
    
    voice = voice_map.get(tone, "en-US-AndrewNeural")
    
    # Adjust speech parameters based on tone
    if tone == "humorous":
        rate = "+15%"
        pitch = "+5Hz"
    elif tone == "serious":
        rate = "+5%"
        pitch = "+0Hz"
    elif tone == "energetic":
        rate = "+20%"
        pitch = "+8Hz"
    else:
        rate = "+10%"
        pitch = "+2Hz"
    
    try:
        communicate = edge_tts.Communicate(
            text=script,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume="+0%"
        )
        
        await communicate.save(str(voice_path))
        return voice_path
        
    except Exception as e:
        print(f"❌ Error generating voice: {e}")
        return None


def generate_timestamps(script: str) -> list:
    """
    Generate word-by-word timestamps for captions
    This is a simple estimation - for precise timing, use speech recognition
    """
    
    words = script.split()
    
    # Average speaking rate: 2.5 words per second
    words_per_second = 2.5
    
    timestamps = []
    current_time = 0.0
    
    for word in words:
        # Clean word
        clean_word = re.sub(r'[^\w\s]', '', word)
        
        if not clean_word:
            continue
        
        # Estimate duration based on word length
        # Longer words take more time
        char_count = len(clean_word)
        base_duration = 1.0 / words_per_second
        duration = base_duration * (0.7 + 0.3 * (char_count / 7))
        
        # Add pause after punctuation
        if any(p in word for p in [',', '.', '!', '?', '...', ':']):
            duration += 0.2
        
        end_time = current_time + duration
        
        timestamps.append({
            "start": round(current_time, 2),
            "end": round(end_time, 2),
            "word": clean_word
        })
        
        current_time = end_time
    
    return timestamps


def save_timestamps(timestamps: list):
    """Save timestamps to file in original format"""
    
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    timestamp_path = output_dir / "timestamps.txt"
    
    with open(timestamp_path, 'w', encoding='utf-8') as f:
        for ts in timestamps:
            f.write(f"{ts['start']}|{ts['end']}|{ts['word']}\n")
    
    print(f"✅ Timestamps saved: {timestamp_path}")


async def get_audio_duration(audio_path: Path) -> Optional[float]:
    """Get duration of audio file"""
    
    try:
        from moviepy.editor import AudioFileClip
        audio = AudioFileClip(str(audio_path))
        duration = audio.duration
        audio.close()
        return duration
    except:
        return None

