import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/*
 * One set of 160 blocks tells the page's story while you scroll:
 * staircase (hero) -> scattered pile (pain) -> twisted tower (program)
 * -> portfolio wall (proof) -> ring around the countdown (offer).
 * Each section owns an `.anchor` element; the blocks fit themselves into it.
 */

const root = document.documentElement;
const stage = document.querySelector('.stage');
const canvas = document.getElementById('scene');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const markReady = () => root.classList.add('is-ready');

const N = 160;
const CORE = 144;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Formations ---------- */
function formation(opts, build) {
  const pos = new Float32Array(N * 3);
  const rot = new Float32Array(N * 3);
  const set = (arr, i, x, y, z) => { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; };
  build(pos, rot, set);
  return { pos, rot, ...opts };
}

// The 16 blocks beyond CORE drift around each shape as loose pieces.
function floaters(pos, rot, set, r0, r1, seed) {
  const r = rng(seed);
  for (let i = CORE; i < N; i++) {
    const th = r() * Math.PI * 2;
    const rad = r0 + r() * (r1 - r0);
    set(pos, i, Math.cos(th) * rad, (r() - 0.5) * r1 * 0.9, Math.sin(th) * rad * 0.5);
    set(rot, i, r() * 6, r() * 6, r() * 6);
  }
}

const stairs = formation({ rx: 5.6, ry: 5.4, rotX: 0.36, rotY: 0.7, spin: 0 }, (pos, rot, set) => {
  let i = 0;
  for (let s = 0; s < 8; s++)
    for (let h = 0; h <= s; h++)
      for (let d = 0; d < 4; d++) set(pos, i++, (s - 3.5) * 1.04, (h - 3.5) * 1.04, (d - 1.5) * 1.04);
  floaters(pos, rot, set, 6, 8.5, 11);
});

const pile = formation({ rx: 7, ry: 6, rotY: 0.3, spin: 0.08, tumble: 1 }, (pos, rot, set) => {
  const r = rng(23);
  for (let i = 0; i < N; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rad = Math.cbrt(r()) * 6.5;
    set(pos, i, rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph) * 0.85, rad * Math.sin(ph) * Math.sin(th));
    set(rot, i, r() * 6, r() * 6, r() * 6);
  }
});

const tower = formation({ rx: 4.6, ry: 5.6, rotY: 0, spin: 0.22 }, (pos, rot, set) => {
  let i = 0;
  for (let f = 0; f < 9; f++) {
    const a = f * 0.17, c = Math.cos(a), s = Math.sin(a);
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) !== 2 && Math.abs(z) !== 2) continue;
        set(pos, i, (x * c - z * s) * 1.05, f * 1.05 - 4.2, (x * s + z * c) * 1.05);
        set(rot, i, 0, -a, 0);
        i++;
      }
  }
  floaters(pos, rot, set, 5, 7.5, 31);
});

const wall = formation({ rx: 7.2, ry: 7.2, rotY: -0.38, spin: 0, wave: 1 }, (pos, rot, set) => {
  let i = 0;
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++) set(pos, i++, (x - 5.5) * 1.08, (y - 5.5) * 1.08, 0);
  floaters(pos, rot, set, 8, 10, 41);
});

const ring = formation({ rx: 7.1, ry: 7.1, rotY: 0, spin: 0, sway: 1 }, (pos, rot, set) => {
  for (let i = 0; i < CORE; i++) {
    const seg = Math.floor(i / 4), layer = i % 4;
    const a = (seg / 36) * Math.PI * 2;
    const r = layer < 2 ? 5.6 : 6.65;
    set(pos, i, Math.cos(a) * r, Math.sin(a) * r, layer % 2 ? 0.52 : -0.52);
    set(rot, i, 0, 0, a);
  }
  const r = rng(51);
  for (let i = CORE; i < N; i++) {
    const a = r() * Math.PI * 2, rad = 8 + r() * 1.6;
    set(pos, i, Math.cos(a) * rad, Math.sin(a) * rad, (r() - 0.5) * 2);
    set(rot, i, r() * 6, r() * 6, r() * 6);
  }
});

const formations = [stairs, pile, tower, wall, ring];
formations.forEach(F => { F.rotX ??= 0.14; });

/* ---------- Scene ---------- */
function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    root.classList.add('no-webgl');
    markReady();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xdfe3ff, 0x1a237e, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(6, 10, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd23f, 1.4);
  rim.position.set(-8, -3, -6);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 22);

  const geo = new RoundedBoxGeometry(0.9, 0.9, 0.9, 3, 0.14);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0, envMapIntensity: 0.85 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;

  // Coloured by staircase step: sky at the bottom, chalk in the middle, yellow at the goal.
  const [chalk, yellow, sky, mint] = ['#F3F1FF', '#FFD23F', '#8FA2FF', '#5CE1B9'].map(c => new THREE.Color(c));
  for (let i = 0; i < N; i++) {
    const step = stairs.pos[i * 3] / 1.04 + 3.5;
    mesh.setColorAt(i, i >= CORE ? mint : step < 2.5 ? sky : step < 5.5 ? chalk : yellow);
  }
  const r = rng(99);

  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);

  // Per-block randomness: morph stagger, flight arc, idle phase, and the intro flight.
  const delay = new Float32Array(N), arc = new Float32Array(N), phase = new Float32Array(N), introDelay = new Float32Array(N);
  const startPos = new Float32Array(N * 3), startRot = new Float32Array(N * 3), disp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    delay[i] = r();
    arc[i] = (r() - 0.3) * 3;
    phase[i] = r() * Math.PI * 2;
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), d = 18 + r() * 12;
    startPos[i * 3] = d * Math.sin(ph) * Math.cos(th);
    startPos[i * 3 + 1] = d * Math.cos(ph) + 8;
    startPos[i * 3 + 2] = d * Math.sin(ph) * Math.sin(th);
    startRot[i * 3] = (r() - 0.5) * 14;
    startRot[i * 3 + 1] = (r() - 0.5) * 14;
    startRot[i * 3 + 2] = (r() - 0.5) * 14;
    // bottom steps land first, so the staircase builds upward
    introDelay[i] = i < CORE ? ((stairs.pos[i * 3 + 1] + 3.5) / 7) * 0.42 + r() * 0.1 : 0.45 + r() * 0.1;
  }

  /* ---------- Layout ---------- */
  const sections = [...document.querySelectorAll('[data-formation]')];
  let metrics = [];
  function measure() {
    const vw = innerWidth, vh = innerHeight, sy = scrollY, mobile = vw < 820;
    metrics = sections.map(sec => {
      const sr = sec.getBoundingClientRect();
      const anchor = sec.querySelector('.anchor');
      const ar = anchor && anchor.offsetWidth ? anchor.getBoundingClientRect() : sr;
      return {
        // a section is "on stage" when its anchor is centred in the viewport
        center: ar.top + sy + ar.height / 2 - vh / 2,
        ax: ar.left + ar.width / 2,
        ay: ar.top + sy + ar.height / 2,
        aw: ar.width,
        ah: Math.min(ar.height, vh),
        dim: parseFloat((mobile && sec.dataset.dimMobile) || sec.dataset.dim || '1'),
        f: formations[+sec.dataset.formation],
      };
    });
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    measure();
  }
  addEventListener('resize', resize);
  let pending = false;
  new ResizeObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; measure(); });
  }).observe(document.body);
  resize();

  /* ---------- Pointer ---------- */
  const pointer = { x: 0, y: 0, active: false };
  addEventListener('pointermove', e => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    pointer.active = true;
  }, { passive: true });
  const release = e => { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') pointer.active = false; };
  document.addEventListener('pointerleave', release);
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  /* ---------- Loop ---------- */
  const dummy = new THREE.Object3D();
  const world = new THREE.Vector3(), push = new THREE.Vector3(), invQ = new THREE.Quaternion();
  const REPEL = 0.2;
  let last = performance.now(), time = 0, blend = -1, tiltX = 0, tiltY = 0;
  let introStart = reduceMotion ? 0 : performance.now() + 150;
  if (reduceMotion) markReady();

  const weightOf = (key, FA, FB, f) => (FA[key] ? 1 - f : 0) + (FB[key] && FB !== FA ? f : 0);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduceMotion) time += dt;

    const vw = innerWidth, vh = innerHeight, sy = scrollY;
    const worldH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const k = worldH / vh;

    // Where are we between two sections?
    let i = 0;
    while (i < metrics.length - 1 && sy >= metrics[i + 1].center) i++;
    const t = i < metrics.length - 1
      ? smoothstep(0.12, 0.88, (sy - metrics[i].center) / (metrics[i + 1].center - metrics[i].center))
      : 0;
    const target = i + t;
    blend = blend < 0 || reduceMotion ? target : lerp(blend, target, 1 - Math.exp(-dt * 7));
    const a = Math.min(Math.floor(blend), metrics.length - 1);
    const b = Math.min(a + 1, metrics.length - 1);
    const f = blend - a;
    const A = metrics[a], B = metrics[b], FA = A.f, FB = B.f;

    // Fit the shape into the live anchor rects.
    const px = lerp(A.ax, B.ax, f);
    const py = lerp(A.ay - sy, B.ay - sy, f);
    group.position.x = (px - vw / 2) * k;
    group.position.y = clamp(-(py - vh / 2) * k, -worldH * 0.32, worldH * 0.32);
    const fit = m => Math.min((m.aw * k) / (2 * m.f.rx), (m.ah * k) / (2 * m.f.ry), 1.15);
    const scale = lerp(fit(A), fit(B), f);
    group.scale.setScalar(scale);
    stage.style.opacity = lerp(A.dim, B.dim, f).toFixed(3);

    const follow = 1 - Math.exp(-dt * 3);
    tiltX = lerp(tiltX, pointer.active && !reduceMotion ? -pointer.y * 0.12 : 0, follow);
    tiltY = lerp(tiltY, pointer.active && !reduceMotion ? pointer.x * 0.28 : 0, follow);
    const ra = FA.rotY + time * FA.spin, rb = FB.rotY + time * FB.spin;
    const sway = weightOf('sway', FA, FB, f) * Math.sin(time * 0.5) * 0.25;
    group.rotation.set(lerp(FA.rotX, FB.rotX, f) + tiltX, ra + wrapPi(rb - ra) * f + tiltY + sway, 0);
    group.updateMatrixWorld();
    invQ.copy(group.quaternion).invert();

    const waveW = weightOf('wave', FA, FB, f);
    const tumbleW = weightOf('tumble', FA, FB, f);
    const intro = introStart ? (now - introStart) / 2600 : 2;
    if (intro > 0.32) markReady();
    const settle = 1 - Math.exp(-dt * 9);

    for (let n = 0; n < N; n++) {
      const j = n * 3;
      const l = easeInOut(clamp((f - delay[n] * 0.4) / 0.6));
      let x = lerp(FA.pos[j], FB.pos[j], l);
      let y = lerp(FA.pos[j + 1], FB.pos[j + 1], l);
      let z = lerp(FA.pos[j + 2], FB.pos[j + 2], l);
      let rx = lerp(FA.rot[j], FB.rot[j], l);
      let ry = lerp(FA.rot[j + 1], FB.rot[j + 1], l);
      let rz = lerp(FA.rot[j + 2], FB.rot[j + 2], l);

      if (!reduceMotion) {
        y += Math.sin(l * Math.PI) * arc[n] + Math.sin(time * 0.9 + phase[n]) * 0.07;
        z += waveW * Math.sin(time * 1.5 + x * 0.5 + y * 0.35) * 0.55;
        rx += tumbleW * time * (phase[n] - 3) * 0.12;
        ry += tumbleW * time * 0.2;
      }

      if (intro < 1.2) {
        const li = clamp((intro - introDelay[n]) / 0.5);
        const e = easeOutBack(li), er = easeOutCubic(li);
        x = lerp(startPos[j], x, e);
        y = lerp(startPos[j + 1], y, e);
        z = lerp(startPos[j + 2], z, e);
        rx = lerp(startRot[j], rx, er);
        ry = lerp(startRot[j + 1], ry, er);
        rz = lerp(startRot[j + 2], rz, er);
      }

      // Cursor pushes nearby blocks away, measured in screen space.
      let tx = 0, ty = 0, tz = 0;
      if (pointer.active && !reduceMotion) {
        world.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
        const dx = (world.x - pointer.x) * camera.aspect, dy = world.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL && d > 1e-4) {
          const p = Math.pow(1 - d / REPEL, 2) * 2.6;
          push.set((dx / d) * p, (dy / d) * p, p * 0.9).applyQuaternion(invQ).divideScalar(scale);
          tx = push.x; ty = push.y; tz = push.z;
        }
      }
      disp[j] = lerp(disp[j], tx, settle);
      disp[j + 1] = lerp(disp[j + 1], ty, settle);
      disp[j + 2] = lerp(disp[j + 2], tz, settle);
      const kick = (Math.abs(disp[j]) + Math.abs(disp[j + 1])) * 0.5;

      dummy.position.set(x + disp[j], y + disp[j + 1], z + disp[j + 2]);
      dummy.rotation.set(rx + kick, ry + kick, rz);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

init();
