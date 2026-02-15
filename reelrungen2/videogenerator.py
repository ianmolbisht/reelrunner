"""
Video Generator using OpenRouter image generation + MoviePy conversion
"""

import base64
import os
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

import aiohttp
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("Set OPENROUTER_API_KEY environment variable")


# Image generation models available on OpenRouter
IMAGE_MODELS = {
    "flux": "black-forest-labs/flux.2-klein-4b",
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
    "dall-e-3": "openai/dall-e-3"
}


async def generate_video(
    prompt: str,
    duration: int = 30,
    style: str = "cinematic",
    model: str = "flux"
) -> Optional[Dict[str, Any]]:
    """
    Generate an image with OpenRouter, then turn it into a short video.

    Returns:
        Dictionary with video_path and metadata
    """

    print(f"Generating background image with {model}...")
    print(f"   Prompt: {prompt}")
    print(f"   Duration: {duration}s")
    print(f"   Style: {style}")

    enhanced_prompt = (
        f"{prompt}. Style: {style}, professional quality, vertical 9:16 composition"
    )

    model_name = IMAGE_MODELS.get(model, IMAGE_MODELS["flux"])

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "Instagram Reel Generator"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": enhanced_prompt
                        }
                    ],
                    "modalities": ["image"],
                    "image_config": {
                        "aspect_ratio": "9:16",
                        "image_size": "1K"
                    },
                    "stream": False
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"API Error ({response.status}): {error_text[:500]}")
                    return None

                result = await response.json()

                image_payload = extract_image_payload(result)
                if not image_payload:
                    print("No image payload returned")
                    return None

                request_id = str(result.get("id") or uuid.uuid4())
                image_path = await save_generated_image(session, image_payload, request_id)
                if not image_path:
                    print("Failed to save generated image")
                    return None

                video_path = image_to_video(image_path, duration, request_id)
                if not video_path:
                    print("Failed to convert image to video")
                    return None

                return {
                    "video_path": str(video_path),
                    "video_id": request_id,
                    "image_path": str(image_path),
                    "prompt": prompt,
                    "model": model
                }

    except Exception as e:
        print(f"Error generating video: {e}")
        return None


def extract_image_payload(result: Dict[str, Any]) -> Optional[Tuple[str, str]]:
    """Return (payload_type, payload_value). payload_type is 'url' or 'b64'."""

    # OpenRouter chat/completions image responses
    choices = result.get("choices")
    if isinstance(choices, list) and choices:
        message = (choices[0] or {}).get("message", {})

        # Most common path: message.images[0].image_url.url
        images = message.get("images")
        if isinstance(images, list) and images:
            first = images[0] or {}

            image_url_obj = first.get("image_url") or first.get("imageUrl")
            if isinstance(image_url_obj, dict) and image_url_obj.get("url"):
                url = image_url_obj["url"]
                if isinstance(url, str) and url.startswith("data:image"):
                    return ("b64", url)
                return ("url", url)

            if first.get("url"):
                return ("url", first["url"])
            if first.get("b64_json"):
                return ("b64", first["b64_json"])

        # Some providers place image_url blocks in message.content
        content = message.get("content")
        if isinstance(content, list):
            for part in content:
                if not isinstance(part, dict):
                    continue
                if part.get("type") in {"image_url", "output_image"}:
                    image_url_obj = part.get("image_url") or part.get("imageUrl")
                    if isinstance(image_url_obj, dict) and image_url_obj.get("url"):
                        url = image_url_obj["url"]
                        if isinstance(url, str) and url.startswith("data:image"):
                            return ("b64", url)
                        return ("url", url)

    # Backward compatibility for alternate response shapes
    data = result.get("data")
    if isinstance(data, list) and data:
        item = data[0]
        if isinstance(item, dict):
            if item.get("url"):
                return ("url", item["url"])
            if item.get("image_url"):
                return ("url", item["image_url"])
            if item.get("b64_json"):
                return ("b64", item["b64_json"])
            if item.get("b64"):
                return ("b64", item["b64"])

    if result.get("url"):
        return ("url", result["url"])
    if result.get("image_url"):
        return ("url", result["image_url"])
    if result.get("b64_json"):
        return ("b64", result["b64_json"])

    return None


async def save_generated_image(
    session: aiohttp.ClientSession,
    image_payload: Tuple[str, str],
    request_id: str
) -> Optional[Path]:
    """Save generated image from URL or base64 payload."""

    output_dir = Path("output/images")
    output_dir.mkdir(parents=True, exist_ok=True)

    payload_type, payload_value = image_payload
    image_path = output_dir / f"{request_id}.png"

    try:
        if payload_type == "url":
            async with session.get(payload_value) as response:
                if response.status != 200:
                    print(f"Image download failed: {response.status}")
                    return None
                image_path.write_bytes(await response.read())
                return image_path

        if payload_type == "b64":
            raw = payload_value
            if raw.startswith("data:image") and "," in raw:
                raw = raw.split(",", 1)[1]
            image_path.write_bytes(base64.b64decode(raw))
            return image_path

    except Exception as e:
        print(f"Image save error: {e}")

    return None


def image_to_video(image_path: Path, duration: int, video_id: str) -> Optional[Path]:
    """Convert a single image into a 9:16 mp4 video."""

    try:
        from PIL import Image
        if not hasattr(Image, "ANTIALIAS") and hasattr(Image, "Resampling"):
            Image.ANTIALIAS = Image.Resampling.LANCZOS

        from moviepy.editor import ImageClip

        output_dir = Path("output/videos")
        output_dir.mkdir(parents=True, exist_ok=True)
        video_path = output_dir / f"{video_id}.mp4"

        clip = ImageClip(str(image_path)).set_duration(duration)
        final_clip = clip.resize(height=1280)

        if final_clip.w > 720:
            final_clip = final_clip.crop(x_center=final_clip.w / 2, width=720, height=1280)
        elif final_clip.w < 720:
            padding = int((720 - final_clip.w) // 2)
            final_clip = final_clip.margin(left=padding, right=padding, color=(0, 0, 0))

        final_clip.write_videofile(
            str(video_path),
            fps=24,
            codec="libx264",
            audio=False,
            verbose=False,
            logger=None
        )

        clip.close()
        final_clip.close()

        print(f"Image converted to video: {video_path}")
        return video_path

    except Exception as e:
        print(f"Image-to-video conversion error: {e}")
        return None


# Fallback: Use static video if API unavailable
def use_fallback_video() -> Optional[Dict[str, Any]]:
    """Use a fallback video if AI generation fails"""

    print("Using fallback video generation...")

    try:
        from moviepy.editor import ColorClip

        output_dir = Path("output/videos")
        output_dir.mkdir(parents=True, exist_ok=True)

        video_path = output_dir / "fallback.mp4"

        clip = ColorClip(
            size=(720, 1280),
            color=(20, 20, 40),
            duration=30
        )

        clip.write_videofile(
            str(video_path),
            fps=24,
            codec="libx264"
        )

        return {
            "video_path": str(video_path),
            "video_id": "fallback",
            "prompt": "fallback",
            "model": "fallback"
        }

    except Exception as e:
        print(f"Fallback generation failed: {e}")
        return None

