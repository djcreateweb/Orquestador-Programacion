"""
Re-procesa los frames con alpha_matting=True para eliminar
los agujeros blancos interiores de las tijeras.
"""
from rembg import remove, new_session
import os

input_folder  = "frames"
output_folder = "frames-transparentes"
os.makedirs(output_folder, exist_ok=True)

session = new_session("u2net")

for filename in sorted(os.listdir(input_folder)):
    if not filename.endswith(".png"):
        continue
    inp = os.path.join(input_folder, filename)
    out = os.path.join(output_folder, filename)
    with open(inp, "rb") as f:
        data = f.read()
    result = remove(
        data,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )
    with open(out, "wb") as f:
        f.write(result)
    print(f"Procesado: {filename}")

print("Listo.")
