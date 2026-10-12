from PIL import Image, ImageDraw
import os

os.makedirs("build", exist_ok=True)
size = (256, 256)
img = Image.new("RGBA", size, (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Outer golden-blue rounded circle
draw.ellipse([8, 8, 248, 248], fill=(15, 23, 42, 255), outline=(245, 184, 66, 255), width=8)

# Inner soft golden ring
draw.ellipse([24, 24, 232, 232], fill=(30, 41, 59, 255), outline=(212, 140, 40, 255), width=3)

# Ice cream scoop layers
draw.ellipse([68, 60, 188, 160], fill=(239, 68, 68, 255))
draw.ellipse([88, 50, 168, 130], fill=(251, 191, 36, 255))
draw.ellipse([100, 40, 156, 96], fill=(56, 189, 248, 255))

# Cone (triangle)
draw.polygon([(80, 140), (176, 140), (128, 220)], fill=(217, 119, 6, 255), outline=(180, 83, 9, 255))

# Grid lines on cone
draw.line([(100, 140), (145, 200)], fill=(180, 83, 9, 255), width=2)
draw.line([(120, 140), (135, 175)], fill=(180, 83, 9, 255), width=2)
draw.line([(156, 140), (110, 200)], fill=(180, 83, 9, 255), width=2)
draw.line([(136, 140), (120, 175)], fill=(180, 83, 9, 255), width=2)

# Save PNG
img.save("build/icon.png", format="PNG")

# Save ICO with multiple resolutions
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save("build/icon.ico", format="ICO", sizes=icon_sizes)
print("Icons created successfully in build/icon.ico and build/icon.png")
