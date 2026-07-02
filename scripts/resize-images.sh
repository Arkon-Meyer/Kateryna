#!/usr/bin/env bash
#
# Resize artwork images for the portfolio website.
#
# Usage:
#   ./scripts/resize-images.sh [source_directory]
#
# Reads all image files (jpg, jpeg, png, tiff, webp) from the source
# directory (default: images/artwork/originals) and creates two versions
# in images/artwork/:
#   - filename.webp       (1600px wide, quality 85 — for lightbox/hero)
#   - filename_thumb.webp (600px wide, quality 75 — for portfolio grid)
#
# Requires: ImageMagick (convert) or libwebp (cwebp + convert).
# On macOS: brew install imagemagick
# On Ubuntu: sudo apt install imagemagick webp
#

set -euo pipefail

SRC_DIR="${1:-images/artwork/originals}"
OUT_DIR="images/artwork"

if [ ! -d "$SRC_DIR" ]; then
  echo "Source directory not found: $SRC_DIR"
  echo "Create it and drop your original artwork files there."
  echo ""
  echo "Expected structure:"
  echo "  images/artwork/originals/"
  echo "    red_forest_fairy_tales.png"
  echo "    truth_series_cover.jpg"
  echo "    ..."
  exit 1
fi

mkdir -p "$OUT_DIR"

count=0

for file in "$SRC_DIR"/*.{jpg,jpeg,png,tiff,webp,JPG,JPEG,PNG,TIFF,WEBP} ; do
  [ -f "$file" ] || continue

  basename=$(basename "$file")
  name="${basename%.*}"

  full_out="$OUT_DIR/${name}.webp"
  thumb_out="$OUT_DIR/${name}_thumb.webp"

  if [ -f "$full_out" ] && [ -f "$thumb_out" ]; then
    echo "  skip  $name (already exists)"
    continue
  fi

  echo "  resize $name"

  convert "$file" -resize '1600x>' -quality 85 -strip "$full_out"
  convert "$file" -resize '600x>'  -quality 75 -strip "$thumb_out"

  count=$((count + 1))
done

echo ""
echo "Done. Processed $count image(s)."
echo "Output: $OUT_DIR/"
echo ""
echo "Next steps:"
echo "  1. Update artwork.json with entries for each image"
echo "  2. Set the 'file' field to the name without extension (e.g. 'red_forest_fairy_tales')"
echo "  3. Push to GitHub"
