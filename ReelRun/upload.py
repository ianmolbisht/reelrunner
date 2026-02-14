from instagrapi import Client
import time

cl = Client()
cl.login("reelrun13", "runREEL<>123")

time.sleep(5)

cl.video_upload(
    "whisper_reel.mp4",
    caption="Daily upload"
)

print("Done")
