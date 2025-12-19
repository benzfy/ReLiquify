import os

def create_ppm(width, height, filename):
    # Blue background
    bg_r, bg_g, bg_b = 44, 62, 80
    # White text/lines
    fg_r, fg_g, fg_b = 236, 240, 241
    # Orange accent
    ac_r, ac_g, ac_b = 230, 126, 34

    header = f"P3\n{width} {height}\n255\n"
    
    with open(filename, 'w') as f:
        f.write(header)
        for y in range(height):
            for x in range(width):
                # Simple logic for "MD" shape or Document shape
                
                # Document border (10% padding)
                if x > width*0.1 and x < width*0.9 and y > height*0.1 and y < height*0.9:
                    # Inside document
                    
                    # Top orange band
                    if y < height*0.3:
                         f.write(f"{ac_r} {ac_g} {ac_b} ")
                    # "M" shape roughly
                    elif (x > width*0.25 and x < width*0.35 and y > height*0.4 and y < height*0.8) or \
                         (x > width*0.65 and x < width*0.75 and y > height*0.4 and y < height*0.8) or \
                         (x > width*0.35 and x < width*0.5 and y > height*0.4 and y < height*0.6 and abs(x - width*0.42) < (y - height*0.4)) or \
                         (x > width*0.5 and x < width*0.65 and y > height*0.4 and y < height*0.6 and abs(x - width*0.58) < (y - height*0.4)):
                         # Rough M attempt? Let's just do lines
                         f.write(f"{bg_r} {bg_g} {bg_b} ")
                    
                    # Horizontal lines for text
                    elif (y > height*0.4 and y < height*0.45) or \
                         (y > height*0.55 and y < height*0.6) or \
                         (y > height*0.7 and y < height*0.75):
                         f.write(f"{bg_r} {bg_g} {bg_b} ")
                    else:
                        f.write(f"{fg_r} {fg_g} {fg_b} ")
                else:
                    # Background
                    f.write(f"{bg_r} {bg_g} {bg_b} ")
            f.write("\n")

create_ppm(128, 128, 'ReLiquify/temp_icon.ppm')






