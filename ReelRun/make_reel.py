from moviepy.editor import *
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import re
import os
import random

# -----------------------
# PICK RANDOM VIDEO
# -----------------------

clips_folder = "clips"

videos = [
    os.path.join(clips_folder, f)
    for f in os.listdir(clips_folder)
    if f.endswith(".mp4")
]

if not videos:
    raise ValueError("No videos found in clips folder")

chosen_video = random.choice(videos)
print("Using video:", chosen_video)

video = VideoFileClip(chosen_video)

# Target Reel size
TARGET_W = 720
TARGET_H = 1280

# Scale just enough
scale = max(TARGET_W/video.w, TARGET_H/video.h)
video = video.resize(scale)

# Then crop center
video = video.crop(
    x_center=video.w/2,
    y_center=video.h/2,
    width=TARGET_W,
    height=TARGET_H
)


# -----------------------
# LOAD AUDIO
# -----------------------

audio = AudioFileClip("voice.mp3")

# Loop video to match audio
video = video.loop(duration=audio.duration).set_audio(audio)

# -----------------------
# COLOR RULES
# -----------------------

danger_words = {
    "danger","death","kill","warning",
    "risk","scary","fear","dead"
}

def get_color(word):
    if re.search(r"\d", word):
        return "#4CFF00"
    if word.lower() in danger_words:
        return "#FF3B3B"
    return "#FFD93D"

# -----------------------
# TEXT IMAGE
# -----------------------

def text_img(text):
    W,H = 520,150
    img = Image.new("RGBA",(W,H),(0,0,0,0))
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",52)

    color = get_color(text)

    draw.rounded_rectangle(
        [(0,0),(W,H)],
        radius=40,
        fill=(0,0,0,180)
    )

    bbox = draw.textbbox((0,0),text,font=font)
    w = bbox[2]-bbox[0]
    h = bbox[3]-bbox[1]

    x=(W-w)//2
    y=(H-h)//2

    # outline
    for dx in range(-3,4):
        for dy in range(-3,4):
            draw.text((x+dx,y+dy),text,font=font,fill="black")

    draw.text((x,y),text,font=font,fill=color)

    return np.array(img)

# -----------------------
# WORD CLIP
# -----------------------

def word_clip(word,start,end):
    img = text_img(word.upper())
    dur = end-start

    return (
        ImageClip(img)
        .set_start(start)
        .set_duration(dur)
        .set_position(("center",0.75), relative=True)  # lower captions
        .resize(lambda t: 1 + 0.25*np.exp(-5*t))
        .fadein(0.05)
        .fadeout(0.05)
    )

# -----------------------
# LOAD TIMESTAMPS
# -----------------------

subs=[]

with open("timestamps.txt",encoding="utf-8") as f:
    lines = f.read().splitlines()

for line in lines:
    s,e,w = line.split("|")
    subs.append(word_clip(w,float(s),float(e)))

# -----------------------
# FINAL
# -----------------------

final = CompositeVideoClip([video] + subs)

final.write_videofile(
    "final_reel.mp4",
    fps=30,
    codec="libx264",
    preset="slow",        # better compression quality
    bitrate="8000k",      # big quality boost
    audio_codec="aac",
    audio_bitrate="192k"
)


print("\n✅ Reel created: final_reel.mp4")
