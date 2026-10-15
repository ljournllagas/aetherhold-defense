"""Package reviewed generated sprites without changing their painted content."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/tower-art/sources'
OUT = ROOT / 'output/tower-art'
geometry = {}
review = Image.new('RGB', (1440, 650), '#263132')
draw = ImageDraw.Draw(review)


def fit_sprite(name, size, visible_height):
    image = Image.open(SOURCE / f'{name}.png').convert('RGBA')
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255), f'{name}: genuine transparency required'
    # Generated alpha-1 specks are invisible but can touch the canvas edge.
    # Crop using visible occupancy; retain every alpha value inside the crop.
    bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < image.width and bounds[3] < image.height, f'{name}: clipped art'
    crop = image.crop(bounds)
    scale = min(visible_height / crop.height, (size - 40 if size == 627 else size - 16) / crop.width)
    crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size))
    offset_x = (size - crop.width) // 2
    canvas.alpha_composite(crop, (offset_x, size - (26 if size == 627 else 9) - crop.height))
    left, top, right, bottom = canvas.getchannel('A').getbbox()
    # The asymmetric bolt rail must not move the pedestal away from the plot.
    foot_top = 0.6 if name.startswith('cinder') else 0.8
    foot = crop.getchannel('A').crop((0, round(crop.height * foot_top), crop.width, crop.height)).getbbox()
    ground_center_x = offset_x + (foot[0] + foot[2]) / 2
    return canvas, dict(left=left, top=top, width=right-left, height=bottom-top, bottom=bottom-1), ground_center_x


for row, tower in enumerate(['sentinel', 'cinder']):
    atlas = Image.new('RGBA', (1254, 1254))
    bounds = []
    ground_centers = []
    for index in range(4):
        sprite, box, ground_x = fit_sprite(f'{tower}-level{index+1}', 627, 520)
        atlas.alpha_composite(sprite, ((index % 2)*627, (index // 2)*627))
        bounds.append(box)
        ground_centers.append(ground_x)
        native = sprite.crop((box['left'], box['top'], box['left']+box['width'], box['bottom']+1))
        native.thumbnail((150, 112 if tower == 'sentinel' else 84), Image.Resampling.LANCZOS)
        review.paste(native, (index*230+45, row*300+150-native.height), native)
        draw.text((index*230+45, row*300+170), f'{tower} L{index+1}', fill='white')
    target = ROOT / f'public/assets/towers/tower_{tower}_stages-v1'
    atlas.save(target.with_suffix('.png'))
    atlas.save(target.with_suffix('.webp'), quality=92, method=6)
    tiers = []
    tier_ground_centers = []
    for tier in [2, 3]:
        sprite, box, ground_x = fit_sprite(f'{tower}-tier{tier}', 192, 168)
        target = ROOT / f'public/assets/campaign/towers/{tower}-tier{tier}-v1'
        sprite.save(target.with_suffix('.png'))
        sprite.save(target.with_suffix('.webp'), quality=92, method=6)
        tiers.append(box)
        tier_ground_centers.append(ground_x)
        native = sprite.crop((box['left'], box['top'], box['left']+box['width'], box['bottom']+1))
        native.thumbnail((150, 112 if tower == 'sentinel' else 84), Image.Resampling.LANCZOS)
        review.paste(native, ((tier+2)*230+45, row*300+150-native.height), native)
        draw.text(((tier+2)*230+45, row*300+170), f'{tower} tier {tier}', fill='white')
    geometry[tower] = {'bounds': bounds, 'groundCentersX': ground_centers, 'campaignBounds': tiers, 'campaignGroundCentersX': tier_ground_centers}
    geometry[tower]['focuses'] = [dict(x=round((box['left']+box['width']-3-ground_x)/box['height'], 4), y=-0.99) for box, ground_x in zip(bounds, ground_centers)] if tower == 'sentinel' else [dict(x=0, y=value) for value in [-0.76, -0.70, -0.64, -0.60]]
    geometry[tower]['campaignFocuses'] = [dict(x=round((box['left']+box['width']-2-ground_x)/box['height'], 4), y=-0.99) for box, ground_x in zip(tiers, tier_ground_centers)] if tower == 'sentinel' else [dict(x=0, y=value) for value in [-0.60, -0.63]]
    geometry[tower]['groundInsets'] = [round(box['height'] * (16 / 112 if tower == 'sentinel' else 18 / 84), 4) for box in bounds]

(OUT / 'geometry.json').write_text(json.dumps(geometry, indent=2)+'\n')
(ROOT / 'src/game/art/additionalTowerGeometry.ts').write_text('// Measured from reviewed sprites by tools/pack-additional-tower-art.py.\nexport const ADDITIONAL_TOWER_GEOMETRY = '+json.dumps(geometry, indent=2)+' as const;\n')
review.save(OUT / 'native-size-review.png')
print(json.dumps(geometry, indent=2))
