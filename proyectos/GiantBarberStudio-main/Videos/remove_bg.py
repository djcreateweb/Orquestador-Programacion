from rembg import remove
from PIL import Image
import os

input_folder = "frames"
output_folder = "frames-transparentes"
os.makedirs(output_folder, exist_ok=True)

for filename in sorted(os.listdir(input_folder)):
    if filename.endswith(".png"):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)
        with open(input_path, "rb") as i:
            with open(output_path, "wb") as o:
                o.write(remove(i.read()))
        print(f"Procesado: {filename}")

print("Todos los frames procesados.")
