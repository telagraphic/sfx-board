#!/bin/bash

# Script to process MP3 files in process-clips directory and generate JSON entries
# Usage: ./process-clips.sh

CLIPS_DIR="process-clips"

# Check if directory exists
if [ ! -d "$CLIPS_DIR" ]; then
    echo "Error: Directory '$CLIPS_DIR' does not exist" >&2
    exit 1
fi

# Function to convert filename to proper name
# Converts "you-got-mail.mp3" to "You Got Mail"
filename_to_name() {
    local filename="$1"
    # Remove .mp3 extension
    local basename="${filename%.mp3}"
    
    # Split by hyphens and capitalize each word
    echo "$basename" | tr '-' ' ' | awk '{
        for (i=1; i<=NF; i++) {
            $i = toupper(substr($i,1,1)) tolower(substr($i,2))
        }
        print
    }'
}

# Find all MP3 files and process them
find "$CLIPS_DIR" -maxdepth 1 -type f -name "*.mp3" | sort | while read -r filepath; do
    filename=$(basename "$filepath")
    name=$(filename_to_name "$filename")
    
    # Output JSON entry
    echo "    {"
    echo "      \"name\": \"$name\","
    echo "      \"file\": \"$filename\""
    echo "    },"
done

