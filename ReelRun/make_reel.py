from moviepy.editor import *
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import textwrap

# LOAD VIDEO + AUDIO
video = VideoFileClip("in.mp4").resize(height=640)
audio = AudioFileClip("voice.mp3")
video = video.loop(duration=audio.duration).set_audio(audio)

# TEXT IMAGE (FIXED)
def text_img(text):
    W,H = 640,180

    img = Image.new("RGBA",(W,H),(0,0,0,120))
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf",36)

    lines = textwrap.wrap(text,width=25)

    y=10
    for line in lines:
        bbox = draw.textbbox((0,0),line,font=font)
        w,h = bbox[2]-bbox[0],bbox[3]-bbox[1]
        x=(W-w)//2

        # outline
        for dx in [-2,2]:
            for dy in [-2,2]:
                draw.text((x+dx,y+dy),line,font=font,fill="black")

        draw.text((x,y),line,font=font,fill="white")
        y+=h+10

    return np.array(img)

# LOAD TIMESTAMPS
lines = open("timestamps.txt",encoding="utf-8").read().splitlines()

subs=[]
group=[]
start_time=None

for i,line in enumerate(lines):
    s,e,w=line.split("|")
    s,e=float(s),float(e)

    if start_time is None:
        start_time=s

    group.append(w)

    if len(group)>=4 or i==len(lines)-1:
        txt=" ".join(group)

        clip=(ImageClip(text_img(txt))
              .set_start(start_time)
              .set_duration(e-start_time)
              .set_position(("center",0.75),relative=True))

        subs.append(clip)

        group=[]
        start_time=None

# FINAL
final=CompositeVideoClip([video]+subs)

final.write_videofile(
    "whisper_reel.mp4",
    fps=20,
    codec="libx264",
    preset="ultrafast",
    audio_codec="aac"
)

print("✅ Whisper synced reel ready!")
