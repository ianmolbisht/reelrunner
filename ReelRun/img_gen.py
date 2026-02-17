import requests
import os
from dotenv import load_dotenv
import base64

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise ValueError("Set OPENROUTER_API_KEY")

url = "https://openrouter.ai/api/v1/chat/completions"

prompt = "A cinematic photo of a lone traveler walking in neon rain, moody, vertical 9:16"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "stabilityai/sdxl",
    "messages": [
        {
            "role": "user",
            "content": prompt
        }
    ]
}

print("Generating image...")

r = requests.post(url, headers=headers, json=data)

print("Status:", r.status_code)

if r.status_code != 200:
    print(r.text)
    raise SystemExit("Request failed")

result = r.json()

# Extract base64 image
img_b64 = result["choices"][0]["message"]["images"][0]["b64_json"]

img_bytes = base64.b64decode(img_b64)

with open("test.png", "wb") as f:
    f.write(img_bytes)

print("✅ Image saved as test.png")
