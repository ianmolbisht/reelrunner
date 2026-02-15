"""
AI-Powered Instagram Reel Generator
Generates reels with AI-generated videos and voiceover
"""

import os
import json
import ast
import asyncio
import sys
from pathlib import Path
from typing import Dict, Any

# Import modules
from videogenerator import generate_video
from scriptgenrator import generate_script_and_voice
from reelcomposer import compose_reel


class ReelGenerator:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)

    async def generate(self):
        """Main pipeline to generate reel"""

        print("=" * 60)
        print("AI REEL GENERATOR")
        print("=" * 60)

        # Step 1: Generate script and voiceover
        print("\n[1/3] Generating script and voiceover...")
        script_data = await generate_script_and_voice(
            topic=self.config.get("topic", "random"),
            tone=self.config.get("tone", "humorous"),
            duration=self.config.get("duration", 30)
        )

        if not script_data:
            print("Failed to generate script")
            return None

        print(f"Script generated: {script_data['script'][:100]}...")
        print(f"Voice saved: {script_data['voice_path']}")

        # Step 2: Generate background video using AI
        print("\n[2/3] Generating background video with AI...")
        video_data = await generate_video(
            prompt=self.config.get("video_prompt", script_data["video_prompt"]),
            duration=script_data["duration"],
            style=self.config.get("video_style", "cinematic"),
            model=self.config.get("video_model", "flux")
        )

        if not video_data:
            print("Failed to generate video")
            return None

        print(f"Video generated: {video_data['video_path']}")

        # Step 3: Compose final reel
        print("\n[3/3] Composing final reel with captions...")
        final_path = await compose_reel(
            video_path=video_data["video_path"],
            audio_path=script_data["voice_path"],
            script=script_data["script"],
            timestamps=script_data["timestamps"],
            output_name=self.config.get("output_name", "final_reel.mp4")
        )

        if not final_path:
            print("Failed to compose reel")
            return None

        print(f"\nDONE! Your reel is ready: {final_path}")
        print("=" * 60)

        return {
            "script": script_data["script"],
            "video_path": video_data["video_path"],
            "final_path": final_path
        }


def load_config() -> Dict[str, Any]:
    """Load configuration from command line JSON or use defaults"""

    if len(sys.argv) > 1:
        # Join all args so PowerShell splitting does not break JSON payloads
        config_raw = " ".join(sys.argv[1:]).strip()

        # First try strict JSON
        try:
            config = json.loads(config_raw)
            print("Loaded configuration from command line")
            return config
        except json.JSONDecodeError:
            pass

        # Then try Python-literal dict syntax as a fallback
        try:
            parsed = ast.literal_eval(config_raw)
            if isinstance(parsed, dict):
                print("Loaded configuration from command line (literal dict fallback)")
                return parsed
        except Exception:
            pass

        print("Invalid JSON/dict config, using defaults")

    # Default configuration
    return {
        "topic": "random",
        "tone": "humorous",
        "duration": 30,
        "video_style": "cinematic",
        "video_model": "flux",
        "output_name": "final_reel.mp4"
    }


async def main():
    """Main entry point"""

    # Load configuration
    config = load_config()

    print("\nConfiguration:")
    print(json.dumps(config, indent=2))
    print()

    # Generate reel
    generator = ReelGenerator(config)
    result = await generator.generate()

    if result:
        print("\nSuccess! Here's what was created:")
        print(f"   Script: {result['script'][:100]}...")
        print(f"   Video: {result['video_path']}")
        print(f"   Final: {result['final_path']}")
    else:
        print("\nFailed to generate reel")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
