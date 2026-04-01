#!/usr/bin/env python3
"""
Image Optimization Script for Memorial Site
Converts large PNG files to optimized WebP format
Requires: pillow (pip install pillow)
"""

import os
from PIL import Image
import sys

def optimize_image(input_path, output_path=None, quality=85, max_width=1920):
    """Convert and optimize image to WebP format"""
    if output_path is None:
        output_path = input_path.replace('.png', '.webp').replace('.jpg', '.webp')
    
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparency
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize if too large
            if img.width > max_width:
                ratio = max_width / img.width
                new_size = (max_width, int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save as WebP
            img.save(output_path, 'WebP', quality=quality, method=6)
            
            # Calculate size reduction
            original_size = os.path.getsize(input_path)
            optimized_size = os.path.getsize(output_path)
            reduction = (original_size - optimized_size) / original_size * 100
            
            print(f"✓ {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
            print(f"  Size: {original_size//1024}KB -> {optimized_size//1024}KB ({reduction:.1f}% reduction)")
            
    except Exception as e:
        print(f"✗ Error processing {input_path}: {e}")

def main():
    assets_dir = "src/assets"
    
    # Images that need optimization (large files)
    large_images = [
        "Childhood in the Highlands1 .png",
        "Garden of Grace 1.png", 
        "Garden of Grace2.png",
        "Garden of Grace3.png",
        "Shosh 2.png",
        "Shosh.png",
        "grandmother-portrait.jpg",
        "timeline-childhood.jpg"
    ]
    
    print("🖼️  Optimizing memorial images...")
    print("=" * 50)
    
    for image_name in large_images:
        input_path = os.path.join(assets_dir, image_name)
        if os.path.exists(input_path):
            optimize_image(input_path, max_width=1200)  # Slightly smaller for web
        else:
            print(f"⚠️  File not found: {input_path}")
    
    print("\n✨ Image optimization complete!")
    print("\nNext steps:")
    print("1. Update imports in components to use .webp files")
    print("2. Test the site locally")
    print("3. Deploy to Netlify")

if __name__ == "__main__":
    main()
