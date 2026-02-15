# 🎬 AI-Powered Instagram Reel Generator

Automatically generate viral Instagram reels with AI-generated images (converted to video), voiceovers, and animated captions.

## ✨ Features

- **AI Visual Generation**: Uses OpenRouter to generate images from text prompts, then converts them to video with MoviePy
- **AI Script Writing**: Gemini generates engaging, viral-ready scripts
- **Text-to-Speech**: Natural-sounding voiceovers with edge-tts
- **Animated Captions**: Word-by-word captions with pop-in animations
- **Sequential Pipeline**: All steps run automatically in order
- **JSON Configuration**: Easy customization via command line
- **9:16 Format**: Perfect for Instagram Reels, TikTok, YouTube Shorts

## 🚀 What's Improved

### From Original Project

1. **AI Visual Generation** (was: static video chunks)
   - Generates custom images using AI models via OpenRouter
   - Supports multiple models: Flux, SDXL, DALL-E 3
   - Videos match the script content and style

2. **Sequential Execution** (was: manual 3-step process)
   - Single command runs entire pipeline
   - Automatic error handling and fallbacks
   - Progress tracking for each step

3. **JSON Input** (was: hardcoded settings)
   - Configure via command line JSON
   - Customizable topic, tone, duration, style
   - Easy to integrate with other tools

4. **Better Organization** (was: 3 separate scripts)
   - Modular architecture with clear separation
   - Each component can be used independently
   - Easier to maintain and extend

## 📋 Requirements

- Python 3.8+
- FFmpeg (for video processing)
- API Keys:
  - Gemini API (for script generation)
  - OpenRouter API (for image generation)

## 🔧 Installation

### 1. Clone and Setup

```bash
# Install Python dependencies
pip install -r requirements.txt --break-system-packages

# On Linux, you may need:
pip install moviepy pillow numpy google-generativeai edge-tts python-dotenv aiohttp --break-system-packages
```

### 2. Install FFmpeg

**Windows:**
```bash
# Using chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

### 3. Get API Keys

1. **Gemini API Key**
   - Go to: https://makersuite.google.com/app/apikey
   - Create new API key
   - Copy the key

2. **OpenRouter API Key**
   - Go to: https://openrouter.ai/keys
   - Sign up and create API key
   - Add credits to your account ($5 minimum)
   - Copy the key

### 4. Configure Environment

```bash
# Copy template
cp .env.template .env

# Edit .env and add your API keys
GEMINI_API_KEY=your_actual_gemini_key
OPENROUTER_API_KEY=your_actual_openrouter_key
```

## 🎮 Usage

### Basic Usage (Default Settings)

```bash
python reel_generator.py
```

This will create a random humorous reel about India with default settings.

### Custom Configuration (JSON Input)

```bash
# Science topic, serious tone, 45 seconds
python reel_generator.py '{"topic": "space exploration", "tone": "serious", "duration": 45}'

# Inspirational quote reel
python reel_generator.py '{"topic": "success stories", "tone": "inspiring", "duration": 30}'

# Technology reel with specific style
python reel_generator.py '{"topic": "AI breakthroughs", "tone": "energetic", "duration": 35, "video_style": "futuristic"}'
```

### Configuration Options

```json
{
  "topic": "string",          // Topic or "random" (default: "random")
  "tone": "string",           // humorous|serious|inspiring|casual|energetic (default: "humorous")
  "duration": 30,             // Duration in seconds (default: 30)
  "video_style": "string",    // cinematic|realistic|creative|abstract (default: "cinematic")
  "video_model": "string",    // flux|sdxl|dall-e-3 (default: "flux")
  "output_name": "string"     // Output filename (default: "final_reel.mp4")
}
```

### Examples

```bash
# Random funny fact
python reel_generator.py '{"tone": "humorous"}'

# Motivational reel
python reel_generator.py '{"topic": "overcoming obstacles", "tone": "inspiring", "duration": 40}'

# Tech news reel
python reel_generator.py '{"topic": "latest tech", "tone": "energetic", "video_style": "futuristic"}'

# Historical fact
python reel_generator.py '{"topic": "ancient India", "tone": "serious", "video_style": "cinematic"}'
```

## 📁 Project Structure

```
.
├── reel_generator.py       # Main orchestrator
├── video_generator.py      # AI image generation via OpenRouter + MoviePy conversion
├── script_generator.py     # Script & voiceover generation
├── reel_composer.py        # Final composition with captions
├── requirements.txt        # Python dependencies
├── .env.template          # Environment variables template
├── .env                   # Your API keys (create this)
└── output/                # Generated files
    ├── videos/            # AI-generated videos
    ├── audio/             # Voiceover files
    ├── timestamps.txt     # Caption timing data
    └── final_reel.mp4     # Your finished reel!
```

## 🔄 Pipeline Flow

```
User Input (JSON)
    ↓
1. Script Generation
   - Gemini creates viral script
   - edge-tts generates voiceover
   - Timestamps calculated
    ↓
2. Visual Generation
   - OpenRouter AI generates image
   - Image matches script theme
   - Converted to video and cached
    ↓
3. Composition
   - Video resized to 9:16
   - Audio synced
   - Animated captions added
   - Final render
    ↓
Output: final_reel.mp4
```

## 🎨 Caption Styling

Captions are automatically colored based on content:

- **Green** (#4CFF00): Numbers and statistics
- **Red** (#FF3B3B): Warning/danger words
- **Cyan** (#00D9FF): Highlight words (amazing, incredible, etc.)
- **Yellow** (#FFD93D): Default text

## 🐛 Troubleshooting

### Video Generation Fails

If OpenRouter image generation fails:
1. Check your API key and credits
2. The system will use a fallback solid-color video
3. You can still get the script and voiceover

### Font Not Found Errors

**Windows:**
- Captions use Arial Bold (usually available)

**Linux:**
- Install fonts: `sudo apt install fonts-dejavu-core`
- Or edit `reel_composer.py` to use your font path

### FFmpeg Errors

Ensure FFmpeg is installed and in PATH:
```bash
ffmpeg -version
```

### API Rate Limits

- Gemini: Usually generous free tier
- OpenRouter: Pay-per-use, monitor your credits
- edge-tts: Free, no limits

## 💡 Tips for Best Results

### Script Topics
- Be specific: "Mumbai street food" > "food"
- Current events work well
- Controversy drives engagement (within reason)
- Facts + emotion = viral

### Tone Selection
- **Humorous**: Best for facts, trivia, entertainment
- **Serious**: News, education, important topics
- **Inspiring**: Stories, motivation, success
- **Energetic**: Tech, sports, exciting content

### Video Styles
- **Cinematic**: Smooth, professional shots
- **Realistic**: Documentary-style footage
- **Creative**: Artistic, abstract visuals
- **Futuristic**: Tech, sci-fi themes

### Duration
- **15-20s**: Quick facts, hooks for feed
- **30s**: Sweet spot for most content
- **45-60s**: Deep dives, stories, tutorials

## 🔌 Integration Examples

### Python Script

```python
import asyncio
import json
from reel_generator import ReelGenerator

async def generate_multiple_reels():
    topics = ["AI", "space", "history"]
    
    for topic in topics:
        config = {
            "topic": topic,
            "tone": "humorous",
            "duration": 30,
            "output_name": f"{topic}_reel.mp4"
        }
        
        generator = ReelGenerator(config)
        await generator.generate()

asyncio.run(generate_multiple_reels())
```

### Batch Processing

```bash
# Create batch.sh
for topic in "AI" "space" "history"; do
    python reel_generator.py "{\"topic\": \"$topic\", \"output_name\": \"${topic}_reel.mp4\"}"
done
```

## 🚀 Advanced Usage

### Custom Video Sources

Want to use your own videos instead of AI generation?
Edit `video_generator.py` and modify the `generate_video()` function to return your video path.

### Custom Voices

Change voice in `script_generator.py`:
```python
voice_map = {
    "humorous": "en-US-GuyNeural",
    "serious": "en-US-AndrewNeural",
    # Add your own...
}
```

List available voices:
```bash
edge-tts --list-voices | grep English
```

### Caption Customization

Edit `reel_composer.py` to change:
- Colors: Modify `get_word_color()`
- Animations: Change `create_word_clip()` 
- Position: Adjust `.set_position()`
- Font size: Change `ImageFont.truetype(font, SIZE)`

## 📊 Cost Estimates

### Per Reel (30s)
- Gemini API: ~$0.001 (free tier available)
- edge-tts: Free
- OpenRouter Video: $0.10 - $0.50 (model dependent)

### Recommended Model Costs (per 30s video)
- Runway Gen3 Turbo: ~$0.10 (fastest)
- Luma Photon: ~$0.30 (photorealistic)
- Kling v1: ~$0.25 (cinematic)
- Minimax: ~$0.20 (creative)

## 🤝 Contributing

Ideas for improvements:
- [ ] More image/video generation providers (Replicate, FAL.ai)
- [ ] Real-time timestamp generation using Whisper
- [ ] Custom caption templates
- [ ] Batch processing UI
- [ ] Direct social media upload
- [ ] Music/sound effects integration

## 📝 License

MIT License - feel free to use and modify!

## 🆘 Support

Issues? Questions?
1. Check the troubleshooting section
2. Verify API keys and credits
3. Check FFmpeg installation
4. Review error messages in console

## 🎯 Roadmap

- [ ] Web UI for easier configuration
- [ ] Template system for different reel styles
- [ ] Auto-upload to Instagram/TikTok
- [ ] Video quality presets
- [ ] Multi-language support
- [ ] Background music library integration
- [ ] A/B testing framework for scripts

---

**Happy Reel Making! 🎬✨**


