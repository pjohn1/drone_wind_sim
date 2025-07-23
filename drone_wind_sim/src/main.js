import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MOUSE } from 'three';
import { simulateDronePhysics } from './physics.js';

// Set up scene, camera, and renderer

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-5, 5, 7.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add a platform (ground)
const platformGeometry = new THREE.BoxGeometry(10, 0.5, 10);
const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.y = -0.25;
scene.add(platform);

// Add a simple cube as the drone
const droneGeometry = new THREE.BoxGeometry(1, 0.3, 1);
const droneMaterial = new THREE.MeshPhongMaterial({ color: 0x00aaff });
const drone = new THREE.Mesh(droneGeometry, droneMaterial);
const initialDroneY = 5;
drone.position.y = initialDroneY;
scene.add(drone);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Add OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
controls.mouseButtons = {
  LEFT: MOUSE.PAN,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.ROTATE
};

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Physics state for the drone
const initialDroneState = {
  x: 0,
  y: initialDroneY,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  roll: 0,
  pitch: 0,
  yaw: 0,
  wx: 0,
  wy: 0,
  wz: 0
};
let droneState = { ...initialDroneState };
let lastTime = null;
let isPlaying = false;

// Play/Reset button logic
const playBtn = document.getElementById('play-btn');
function setButtonToPlay() {
  playBtn.textContent = 'Play';
  playBtn.onclick = () => {
    isPlaying = true;
    playBtn.textContent = 'Reset';
    playBtn.onclick = resetSimulation;
    lastTime = null;
  };
}
function resetSimulation() {
  isPlaying = false;
  droneState = { ...initialDroneState };
  drone.position.set(droneState.x, droneState.y, droneState.z);
  setButtonToPlay();
}
setButtonToPlay();

// Telemetry update function
function updateTelemetry() {
  const { x, y, z, vx, vy, vz } = droneState;
  document.getElementById('telemetry').innerHTML =
    `<b>Drone Telemetry</b><br>` +
    `x: ${x.toFixed(2)}<br>` +
    `y: ${y.toFixed(2)}<br>` +
    `z: ${z.toFixed(2)}<br>` +
    `vx: ${vx.toFixed(2)}<br>` +
    `vy: ${vy.toFixed(2)}<br>` +
    `vz: ${vz.toFixed(2)}`;
}

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);

  if (isPlaying) {
    if (lastTime === null) lastTime = time;
    const dt = (time - lastTime) / 1000; // seconds
    lastTime = time;

    // Simulate physics
    const inputs = {};
    const deltas = simulateDronePhysics(droneState, inputs, dt);

    // Integrate state
    droneState.x += deltas.dx;
    droneState.y += deltas.dy;
    droneState.z += deltas.dz;
    droneState.vx += deltas.dvx;
    droneState.vy += deltas.dvy;
    droneState.vz += deltas.dvz;
    // (roll, pitch, yaw, wx, wy, wz can be added later)

    // Prevent drone from falling through the platform (y=0.15 is top of platform)
    if (droneState.y < 0.15) {
      droneState.y = 0.15;
      droneState.vy = 0;
    }
    drone.position.set(droneState.x, droneState.y, droneState.z);
  }

  updateTelemetry();
  renderer.render(scene, camera);
  controls.update();
}
requestAnimationFrame(animate); 