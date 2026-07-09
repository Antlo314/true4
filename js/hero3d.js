/* =====================================================================
   HERO 3D — metallic "IV" emblem (Three.js)
   The Roman numeral IV is Tru Foe's signature ("Tha Solid One · 4").
   Rendered as a beveled, brushed-gold object with studio reflections,
   floating in a champagne particle haze, reacting to the pointer + scroll.
   ===================================================================== */

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("heroCanvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Bail gracefully if WebGL isn't available — CSS hero still stands on its own.
function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

if (canvas && webglOK()) {
  init();
} else if (canvas) {
  canvas.style.display = "none";
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  // --- studio reflections (environment only, transparent background) ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // --- lights: gold key, rose rim, cool fill ---
  const key = new THREE.DirectionalLight(0xffe9c2, 2.6);
  key.position.set(4, 6, 5);
  scene.add(key);

  const rim = new THREE.PointLight(0xc0656b, 60, 30);
  rim.position.set(-5, -1, 2);
  scene.add(rim);

  const fill = new THREE.PointLight(0xedcf8a, 22, 40);
  fill.position.set(3, -3, 6);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x2a211c, 1.2));

  // --- group that holds the emblem ---
  const group = new THREE.Group();
  scene.add(group);

  // Gold material — high metalness, low roughness, warm tint.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9a45c,
    metalness: 1.0,
    roughness: 0.26,
    envMapIntensity: 1.35,
  });

  // --- the "IV" via TextGeometry (loaded font) ---
  const loader = new FontLoader();
  loader.load(
    "https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      const geo = new TextGeometry("IV", {
        font,
        size: 2.6,
        height: 0.7,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.09,
        bevelSegments: 4,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, goldMat);
      group.add(mesh);

      // thin rose "shadow" copy behind, for depth
      const backMat = new THREE.MeshBasicMaterial({ color: 0x7c2f38, transparent: true, opacity: 0.5 });
      const back = new THREE.Mesh(geo, backMat);
      back.position.z = -0.6;
      back.scale.setScalar(1.02);
      group.add(back);

      group.userData.ready = true;
    },
    undefined,
    () => { /* font failed — particles still render */ }
  );

  // --- champagne particle haze ---
  const P = 420;
  const pos = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xdcbd85, size: 0.045, transparent: true, opacity: 0.55,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---------------- layout / responsive placement ----------------
  let heroH = 1;
  function layout() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    heroH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Shift the emblem toward the right on wide screens (text sits left);
    // center + push back on narrow screens so it reads as a backdrop.
    if (w < 760) {
      group.position.set(0.9, 1.25, -1.4);
      group.scale.setScalar(0.7);
      particles.visible = true;
    } else {
      // sits behind the portrait column — crown of the IV rises above the arch
      group.position.set(2.2, 0.85, -1.1);
      group.scale.setScalar(0.92);
    }
  }
  layout();
  window.addEventListener("resize", layout);

  // ---------------- pointer parallax ----------------
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5);
    target.y = (e.clientY / window.innerHeight - 0.5);
  });

  // ---------------- scroll fade (emblem drifts up + fades) ----------------
  let scrollN = 0;
  function onScroll() {
    scrollN = Math.min(1, Math.max(0, window.scrollY / heroH));
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------------- animate ----------------
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    const dt = reduce ? 0 : 1;

    // ease pointer
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;

    if (group.userData.ready) {
      group.rotation.y = cur.x * 0.6 + Math.sin(t * 0.3) * 0.08 * dt;
      group.rotation.x = cur.y * 0.4 + Math.cos(t * 0.4) * 0.04 * dt;
    }

    // idle float + scroll drift (up & out) + fade
    group.position.y = basePosY() + Math.sin(t * 0.8) * 0.12 * dt - scrollN * 2.2;
    pMat.opacity = 0.55 * (1 - scrollN);
    canvas.style.opacity = String(1 - scrollN * 0.9);

    particles.rotation.y = t * 0.02 * dt;
    particles.rotation.x = cur.y * 0.1;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function basePosY() {
    return (canvas.clientWidth || window.innerWidth) < 760 ? 1.25 : 0.85;
  }

  tick();
}
