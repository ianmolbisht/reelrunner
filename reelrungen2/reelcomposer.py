"""
Reel Composer
Combines video, audio, and animated captions into final reel
"""

import os
from pathlib import Path
from typing import Optional, List, Dict
import numpy as np

try:
    from moviepy.editor import (
        VideoFileClip, AudioFileClip, ImageClip,
        CompositeVideoClip, ColorClip
    )
    from PIL import Image, ImageDraw, ImageFont
    # Pillow>=10 removed Image.ANTIALIAS, but MoviePy 1.x still references it.
    if not hasattr(Image, "ANTIALIAS") and hasattr(Image, "Resampling"):
        Image.ANTIALIAS = Image.Resampling.LANCZOS
except ImportError:
    print("⚠️  Install required packages: pip install moviepy pillow --break-system-packages")
    raise


# Color scheme for captions
DANGER_WORDS = {
    "danger", "death", "kill", "warning",
    "risk", "scary", "fear", "dead", "died",
    "disaster", "tragedy", "horror"
}

HIGHLIGHT_WORDS = {
    "amazing", "incredible", "shocking", "wow",
    "unbelievable", "mind-blowing", "crazy", "insane"
}


def get_word_color(word: str) -> str:
    """Get color for word based on content"""
    
    word_lower = word.lower()
    
    # Numbers in green
    if any(c.isdigit() for c in word):
        return "#4CFF00"
    
    # Danger words in red
    if word_lower in DANGER_WORDS:
        return "#FF3B3B"
    
    # Highlight words in cyan
    if word_lower in HIGHLIGHT_WORDS:
        return "#00D9FF"
    
    # Default yellow
    return "#FFD93D"


def create_text_image(text: str) -> np.ndarray:
    """
    Create styled text image with background
    
    Returns numpy array suitable for ImageClip
    """
    
    # Image dimensions
    W, H = 620, 180
    
    # Create transparent image
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Try to load font, fallback if not available
    try:
        if os.name == 'nt':  # Windows
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 56)
        else:  # Linux/Mac
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
    except:
        font = ImageFont.load_default()
    
    # Get text color
    color = get_word_color(text)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [(0, 0), (W, H)],
        radius=45,
        fill=(0, 0, 0, 200)
    )
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center coordinates
    x = (W - text_width) // 2
    y = (H - text_height) // 2
    
    # Draw text shadow for depth
    for dx in range(-5, 6):
        for dy in range(-5, 6):
            if dx != 0 or dy != 0:
                draw.text(
                    (x + dx, y + dy),
                    text,
                    font=font,
                    fill="black"
                )
    
    # Draw main text
    draw.text((x, y), text, font=font, fill=color)
    
    return np.array(img)


def create_word_clip(word: str, start: float, end: float):
    """
    Create animated text clip for a single word
    
    Features:
    - Pop-in animation
    - Centered positioning
    - Smooth fade in/out
    """
    
    img = create_text_image(word.upper())
    duration = end - start
    
    return (
        ImageClip(img)
        .set_start(start)
        .set_duration(duration)
        .set_position(("center", 0.55), relative=True)  # Slightly above center
        .resize(lambda t: 1 + 0.4 * np.exp(-7 * t))      # Pop-in effect
        .fadein(0.08)
        .fadeout(0.08)
    )


async def compose_reel(
    video_path: str,
    audio_path: str,
    script: str,
    timestamps: List[Dict],
    output_name: str = "final_reel.mp4"
) -> Optional[str]:
    """
    Compose final reel with video, audio, and captions
    
    Args:
        video_path: Path to background video
        audio_path: Path to voiceover audio
        script: The script text
        timestamps: List of word timestamps
        output_name: Output filename
    
    Returns:
        Path to final video file
    """
    
    print("🎬 Composing final reel...")
    
    try:
        # Load video
        print("   Loading video...")
        video = VideoFileClip(video_path)
        
        # Resize and crop to 9:16 aspect ratio (720x1280)
        target_width = 720
        target_height = 1280
        
        # Resize to match height
        video = video.resize(height=target_height)
        
        # Crop to center if too wide
        if video.w > target_width:
            x_center = video.w / 2
            video = video.crop(
                x_center=x_center,
                width=target_width,
                height=target_height
            )
        # Pad if too narrow
        elif video.w < target_width:
            padding = (target_width - video.w) // 2
            video = video.margin(
                left=padding,
                right=padding,
                color=(0, 0, 0)
            )
        
        # Load audio
        print("   Loading audio...")
        audio = AudioFileClip(audio_path)
        
        # Loop video to match audio duration
        if video.duration < audio.duration:
            video = video.loop(duration=audio.duration)
        else:
            video = video.subclip(0, audio.duration)
        
        # Set audio
        video = video.set_audio(audio)
        
        # Create caption clips
        print(f"   Creating {len(timestamps)} caption clips...")
        caption_clips = []
        
        for ts in timestamps:
            try:
                clip = create_word_clip(
                    word=ts['word'],
                    start=ts['start'],
                    end=ts['end']
                )
                caption_clips.append(clip)
            except Exception as e:
                print(f"⚠️  Skipping word '{ts['word']}': {e}")
        
        print(f"   Added {len(caption_clips)} captions")
        
        # Composite all clips
        print("   Compositing final video...")
        final = CompositeVideoClip([video] + caption_clips)
        
        # Output path
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / output_name
        
        # Write final video
        print("   Rendering (this may take a few minutes)...")
        final.write_videofile(
            str(output_path),
            fps=24,
            codec="libx264",
            preset="medium",  # Balance between speed and quality
            audio_codec="aac",
            audio_bitrate="192k",
            threads=4
        )
        
        # Clean up
        video.close()
        audio.close()
        final.close()
        
        print(f"✅ Reel saved: {output_path}")
        return str(output_path)
        
    except Exception as e:
        print(f"❌ Error composing reel: {e}")
        import traceback
        traceback.print_exc()
        return None


def create_simple_reel(
    video_path: str,
    audio_path: str,
    output_name: str = "simple_reel.mp4"
) -> Optional[str]:
    """
    Create simple reel without captions (fallback option)
    """
    
    try:
        print("🎬 Creating simple reel (no captions)...")
        
        video = VideoFileClip(video_path)
        audio = AudioFileClip(audio_path)
        
        # Resize to 9:16
        video = video.resize(height=1280)
        if video.w > 720:
            video = video.crop(x_center=video.w/2, width=720, height=1280)
        
        # Match duration
        video = video.loop(duration=audio.duration).set_audio(audio)
        
        # Output
        output_dir = Path("output")
        output_path = output_dir / output_name
        
        video.write_videofile(
            str(output_path),
            fps=24,
            codec="libx264",
            audio_codec="aac"
        )
        
        video.close()
        audio.close()
        
        return str(output_path)
        
    except Exception as e:
        print(f"❌ Error creating simple reel: {e}")
        return None
