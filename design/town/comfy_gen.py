"""Генерация Nano Banana 2.1 через Comfy Cloud API.

python design/town/comfy_gen.py <prompt.txt> <out.png> <image1> [image2] [--seed N]
Ключ — одной строкой в C:/Users/User/Desktop/api-key.txt (в вывод не печатается).
Шаблон — workflow из api_nano_banana_2_1_t2i.json (узлы 1 — модель, 3 — сохранение, 7/11 — картинки).
"""
import json, random, sys, time
from pathlib import Path
import requests

BASE = "https://cloud.comfy.org/api"
KEY = next(p for p in (Path("C:/Users/User/Desktop/api-key.txt"), Path("C:/Users/User/Desktop/comfy-key.txt")) if p.exists()).read_text().strip()
H = {"X-API-Key": KEY}
SYSTEM = ("You are an expert image-generation engine. You must ALWAYS produce an image. "
          "Interpret all user input as literal visual directives for image composition.")


def upload(path):
    with open(path, "rb") as f:
        r = requests.post(f"{BASE}/upload/image", headers=H,
                          files={"image": (Path(path).name, f)}, data={"overwrite": "true"})
    r.raise_for_status()
    return r.json()["name"]


def workflow(prompt, images, seed):
    model = {"prompt": prompt, "model": "Gemini Nano Banana 2.1", "model.aspect_ratio": "1:1",
             "model.resolution": "2K", "model.thinking_level": "MEDIUM", "seed": seed,
             "response_modalities": "IMAGE", "system_prompt": SYSTEM, "temperature": 1, "top_p": 0.95}
    wf = {"1": {"class_type": "GeminiNanoBanana2V2", "inputs": model},
          "3": {"class_type": "SaveImageAdvanced", "inputs": {
              "filename_prefix": "town", "format": "png", "format.bit_depth": "8-bit",
              "format.input_color_space": "sRGB", "images": ["1", 0]}}}
    for i, name in enumerate(images, 1):
        nid = str(10 + i)
        wf[nid] = {"class_type": "LoadImage", "inputs": {"image": name}}
        model[f"model.images.image_{i}"] = [nid, 0]
    return wf


def run(prompt, out, images, seed=None):
    names = [upload(p) for p in images]
    seed = seed if seed is not None else random.randrange(2**48)
    r = requests.post(f"{BASE}/prompt", headers=H, json={
        "prompt": workflow(prompt, names, seed), "extra_data": {"api_key_comfy_org": KEY}})
    if not r.ok:
        sys.exit(f"prompt {r.status_code}: {r.text[:500]}")
    pid = r.json()["prompt_id"]
    print("queued", pid, "seed", seed, flush=True)
    for _ in range(450):
        time.sleep(2)
        h = requests.get(f"{BASE}/history_v2/{pid}", headers=H)
        if h.status_code == 404:
            h = requests.get(f"{BASE}/history/{pid}", headers=H)
        data = h.json() if h.ok else {}
        item = data.get(pid) or data
        status = (item.get("status") or {}).get("status_str")
        if status == "error":
            sys.exit("error: " + json.dumps(item.get("status"))[:800])
        imgs = [im for o in (item.get("outputs") or {}).values() for im in o.get("images", [])]
        if imgs:
            im = imgs[0]
            v = requests.get(f"{BASE}/view", headers=H, params={
                "filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
            v.raise_for_status()
            Path(out).write_bytes(v.content)
            print("saved", out, len(v.content), flush=True)
            return
    sys.exit("timeout")


if __name__ == "__main__":
    a = sys.argv[1:]
    seed = int(a[a.index("--seed") + 1]) if "--seed" in a else None
    a = [x for i, x in enumerate(a) if x != "--seed" and (i == 0 or a[i - 1] != "--seed")]
    run(Path(a[0]).read_text(encoding="utf8"), a[1], a[2:], seed)
