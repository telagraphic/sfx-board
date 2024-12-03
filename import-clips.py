import json
import os

# Load current clips
json_path = "/Users/nickname/Documents/sfx-board/soundclips.json"
audio_clips_path = "/Users/nickname/Documents/sfx-board/audio-clips/"

with open(json_path, 'r') as json_file:
    data = json.load(json_file)

# Existing filenames in JSON
existing_files = {clip["file"] for clip in data["clips"]}

# Gather new MP3 files to be added
for mp3_file in os.listdir(audio_clips_path):
    if mp3_file.endswith('.mp3'):
        relative_path = f"audio-clips/{mp3_file}"
        if relative_path not in existing_files:
            clip_name = os.path.splitext(mp3_file)[0]
            data["clips"].append({"name": clip_name, "file": relative_path})

# Save back to JSON
with open(json_path, 'w') as json_file:
    json.dump(data, json_file, indent=4)

print(f"New clips added to {json_path}")