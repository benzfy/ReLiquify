# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pillow",
# ]
# ///
import os
from PIL import Image, ImageDraw

def create_liquid_icon(size, filename):
    # 超采样倍数：在 4 倍大的画布上绘制，然后缩小，以实现完美抗锯齿
    scale = 4
    actual_size = size * scale
    
    # 创建画布，背景色 #2c3e50
    img = Image.new('RGBA', (actual_size, actual_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆角矩形背景
    bg_color = (44, 62, 80, 255) # #2c3e50
    corner_radius = actual_size // 5
    draw.rounded_rectangle([(0, 0), (actual_size, actual_size)], radius=corner_radius, fill=bg_color)
    
    # 绘制 "L" 形状
    l_color = (40, 200, 254, 255) # Cyan-Blue
    
    stroke_width = actual_size // 6
    padding_left = actual_size // 3
    padding_bottom = actual_size - (actual_size // 4)
    
    # L 的顶点
    p1 = (padding_left, actual_size // 4)           # Top
    p2 = (padding_left, padding_bottom)             # Corner
    p3 = (actual_size - (actual_size // 4), padding_bottom) # Right
    
    # 绘制线条
    draw.line([p1, p2], fill=l_color, width=stroke_width)
    draw.line([(padding_left, padding_bottom), p3], fill=l_color, width=stroke_width)
    
    # 补圆角（端点和转角）
    r = stroke_width // 2 - 1 # -1 微调避免溢出边缘
    
    # 顶部端点
    draw.ellipse([p1[0]-r, p1[1]-r, p1[0]+r, p1[1]+r], fill=l_color)
    # 底部转角
    draw.ellipse([p2[0]-r, p2[1]-r, p2[0]+r, p2[1]+r], fill=l_color)
    # 右侧端点
    draw.ellipse([p3[0]-r, p3[1]-r, p3[0]+r, p3[1]+r], fill=l_color)

    # 高质量缩小 (LANCZOS 滤镜)
    img = img.resize((size, size), Image.Resampling.LANCZOS)

    # 保存
    img.save(filename)
    print(f"Generated {filename} (with {scale}x supersampling)")

def main():
    icons_dir = 'ReLiquify/icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
        
    sizes = [16, 48, 128]
    for size in sizes:
        create_liquid_icon(size, os.path.join(icons_dir, f'icon{size}.png'))

if __name__ == "__main__":
    main()

