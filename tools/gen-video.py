"""Turn a scene still into a moving clip on OmiPC's ComfyUI (MiniMax H3 image-to-video, local GPU).
  python3 tools/gen-video.py p10 p11 ...     art/<id>.png + art/motion/<id>.txt -> art/video/<id>.mp4
The clip length follows the scene's window in film.json. Each job is announced on the OmiPC GPU
dashboard and waits while the dashboard is paused or a voice job holds the GPU.
Set OMIPC (host) in the environment; nothing about the machine is stored here."""
import json, os, sys, time, math, random, urllib.request, urllib.parse

HOST = os.environ['OMIPC']
COMFY, DASH = f'http://{HOST}:8188', f'http://{HOST}:5299'
SONG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(SONG, 'art')
FILM = json.load(open(os.path.join(SONG, 'film.json')))

def get(url, timeout=20):
    with urllib.request.urlopen(url, timeout=timeout) as r: return r.read()
def post(url, body, ctype='application/json', timeout=60):
    req = urllib.request.Request(url, data=body if isinstance(body, bytes) else json.dumps(body).encode(), headers={'Content-Type': ctype})
    with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read() or b'{}')

def hold_reason():
    try:
        c = json.loads(get(f'{DASH}/api/control'))
        if (c.get('control') or c.get('state')) != 'run': return 'dashboard paused'
        for j in json.loads(get(f'{DASH}/api/renders')).get('active', []):
            if j.get('agent') != 'Claude' and any(w in f"{j.get('tool','')} {j.get('description','')}".lower() for w in ('voice', 'tts', 'speech', 'vocal')):
                return f"{j.get('agent')} voice job"
    except Exception as e:
        return None
    return None

def upload(path, name):
    b = '----arkboundary'
    data = open(path, 'rb').read()
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + \
           (f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n').encode()
    return post(f'{COMFY}/upload/image', body, f'multipart/form-data; boundary={b}')['name']

def workflow(img, prompt, frames, seed, prefix):
    return {
        '1': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors', 'type': 'minimax', 'device': 'default'}},
        '2': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'minimax_h3_fl2va_pruned_int8_convrot.safetensors', 'weight_dtype': 'default'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'minimax_h3_video_vae_fp16.safetensors'}},
        '17': {'class_type': 'MiniMaxH3TurboLoRA', 'inputs': {'model': ['2', 0], 'lora_name': 'minimax_h3_turbo_v4_step600_ema_pruned_comfyui.safetensors', 'strength': 1.0, 'low_vram': True}},
        '5': {'class_type': 'MiniMaxH3SigmaShift', 'inputs': {'model': ['17', 0], 'shift_video': 12, 'shift_audio': 3}},
        '16': {'class_type': 'LoadImage', 'inputs': {'image': img}},
        '6': {'class_type': 'MiniMaxH3ImageToVideo', 'inputs': {'clip': ['1', 0], 'vae': ['3', 0], 'first_frame': ['16', 0], 'prompt': prompt, 'width': 960, 'height': 544, 'length': frames}},
        '7': {'class_type': 'BasicGuider', 'inputs': {'model': ['5', 0], 'conditioning': ['6', 0]}},
        '8': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}},
        '9': {'class_type': 'BasicScheduler', 'inputs': {'model': ['5', 0], 'scheduler': 'simple', 'steps': 4, 'denoise': 1}},
        '10': {'class_type': 'MiniMaxH3TurboSampler', 'inputs': {}},
        '11': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['8', 0], 'guider': ['7', 0], 'sampler': ['10', 0], 'sigmas': ['9', 0], 'latent_image': ['6', 1]}},
        '12': {'class_type': 'VAEDecode', 'inputs': {'samples': ['11', 0], 'vae': ['3', 0]}},
        '14': {'class_type': 'CreateVideo', 'inputs': {'images': ['12', 0], 'fps': 24, 'bit_depth': 8}},
        '15': {'class_type': 'SaveVideo', 'inputs': {'video': ['14', 0], 'filename_prefix': prefix, 'format': 'auto', 'codec': 'auto'}},
    }

def window(id_):
    n = id_[1:]
    s = next(s for s in FILM['scenes'] if s['id'] == n)
    return s['to'] - s['from']

os.makedirs(os.path.join(ART, 'video'), exist_ok=True)
for id_ in sys.argv[1:]:
    out = os.path.join(ART, 'video', f'{id_}.mp4')
    if os.path.exists(out): print(id_, 'exists'); continue
    while (why := hold_reason()):
        print(id_, 'waiting:', why, flush=True); time.sleep(30)
    frames = 4 * math.ceil((window(id_) + 0.3) * 24 / 4)
    prompt = open(os.path.join(ART, 'motion', f'{id_}.txt')).read().strip()
    img = upload(os.path.join(ART, f'{id_}.png'), f'poisoned-cups-{id_}.png')
    seed = random.Random(id_).randrange(1 << 31)
    dash = {}
    try: dash = post(f'{DASH}/api/renders/start', {'agent': 'Claude', 'origin_machine': 'mac-mini', 'tool': 'ComfyUI MiniMax H3 i2v', 'description': f'Poisoned Cups {id_} code-people clip ({frames} frames)', 'project': 'poisoned-cups', 'expected_minutes': 3})
    except Exception: pass
    t0 = time.time()
    pid = post(f'{COMFY}/prompt', {'prompt': workflow(img, prompt, frames, seed, f'poisoned-cups/{id_}')})['prompt_id']
    print(id_, 'queued', pid, frames, 'frames', flush=True)
    ok = False
    while time.time() - t0 < 1800:
        time.sleep(10)
        h = json.loads(get(f'{COMFY}/history/{pid}'))
        if pid not in h: continue
        st = h[pid].get('status', {})
        if st.get('status_str') == 'error': print(id_, 'FAILED', json.dumps(st)[:500]); break
        for node in h[pid].get('outputs', {}).values():
            for v in node.get('images', []) + node.get('videos', []) + node.get('gifs', []):
                if v.get('filename', '').endswith(('.mp4', '.webm', '.mov')):
                    q = urllib.parse.urlencode({'filename': v['filename'], 'subfolder': v.get('subfolder', ''), 'type': v.get('type', 'output')})
                    open(out, 'wb').write(get(f'{COMFY}/view?{q}', timeout=300)); ok = True
        if ok or st.get('completed'): break
    try: post(f"{DASH}/api/renders/end", {'id': dash.get('id'), 'status': 'done' if ok else 'failed'}) if dash.get('id') else None
    except Exception: pass
    print(id_, 'ok' if ok else 'NO OUTPUT', f'{time.time() - t0:.0f}s', flush=True)
