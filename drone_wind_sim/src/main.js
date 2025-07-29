import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MOUSE } from 'three';
import { simulateDronePhysics } from './physics_sim.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { calcForces } from './forces_calc.js';
import { getCompMatrix } from './pid_compensator.js'
import { getR } from './rotation_matrix.js'

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

// Remove the old cube as the drone
// const droneGeometry = new THREE.BoxGeometry(1, 0.3, 1);
// const droneMaterial = new THREE.MeshPhongMaterial({ color: 0x00aaff });
// const drone = new THREE.Mesh(droneGeometry, droneMaterial);
// drone.position.y = initialDroneY;
// scene.add(drone);

// Load Collada drone model
let drone = null;
const loader = new ColladaLoader();
loader.load('src/hummingbird.dae', (collada) => {
  drone = collada.scene;
  drone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  // Initial position, rotation, and scale
  drone.position.set(initialDroneState.x, initialDroneState.y, initialDroneState.z);
  drone.rotation.x = 0.0;
  drone.scale.set(2, 2, 2); // Scale 1
  scene.add(drone);
});

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
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

const initialDroneY = 5;

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

// Wind vector (constant for now)
const wind = { x: 0.1, y: 0.1, z: 0.1 };
const mass = 1;

// Axis indicator setup (now at the origin in the main scene)
const axisScene = scene; // Use main scene
const axisOrigin = new THREE.Group();
axisOrigin.position.set(0, 0, 0);
scene.add(axisOrigin);

// X axis (red)
const xMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
const xGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(1, 0, 0)
]);
const xAxis = new THREE.Line(xGeom, xMat);
axisOrigin.add(xAxis);
// Y axis (green)
const yMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const yGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 1, 0)
]);
const yAxis = new THREE.Line(yGeom, yMat);
axisOrigin.add(yAxis);
// Z axis (blue)
const zMat = new THREE.LineBasicMaterial({ color: 0x0000ff });
const zGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, 1)
]);
const zAxis = new THREE.Line(zGeom, zMat);
axisOrigin.add(zAxis);

// Axis labels using CSS2DRenderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.left = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.backgroundColor = 'rgba(0, 0, 0, 0)';
document.getElementById('container').appendChild(labelRenderer.domElement);

function makeLabel(text, color) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.color = color;
  div.style.fontWeight = 'bold';
  div.style.fontSize = '1em';
  div.style.textShadow = '0 0 2px #222, 0 0 2px #222';
  div.style.zIndex = '1000';
  div.style.pointerEvents = 'none';
  return new CSS2DObject(div);
}
const xLabel = makeLabel('x', '#ff0000');
xLabel.position.set(1.18, 0, 0);
axisOrigin.add(xLabel);
const yLabel = makeLabel('y', '#00ff00');
yLabel.position.set(0, 1.18, 0);
axisOrigin.add(yLabel);
const zLabel = makeLabel('z', '#0000ff');
zLabel.position.set(0, 0, 1.18);
axisOrigin.add(zLabel);

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
  drone.rotation.set(0.0,0.0,0.0);
  setButtonToPlay();
}
setButtonToPlay();

// Telemetry update function
function updateTelemetry() {
  const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = droneState;
  document.getElementById('telemetry').innerHTML =
    `<b>Drone Telemetry</b><br>` +
    `x: ${x.toFixed(2)}<br>` +
    `y: ${y.toFixed(2)}<br>` +
    `z: ${z.toFixed(2)}<br>` +
    `vx: ${vx.toFixed(2)}<br>` +
    `vy: ${vy.toFixed(2)}<br>` +
    `vz: ${vz.toFixed(2)}<br>` +
    `roll: ${roll.toFixed(2)}<br>` +
    `pitch: ${pitch.toFixed(2)}<br>` +
    `yaw: ${yaw.toFixed(2)}<br>` +
    `wx: ${wx.toFixed(2)}<br>` +
    `wy: ${wy.toFixed(2)}<br>` +
    `wz: ${wz.toFixed(2)}`;
}


// Wind stripes setup
const windStripes = [];
const numStripes = 18;
const stripeLength = 2.5;
const stripeWidth = 0.12;
const stripeHeight = 0.01;
const areaSize = 8; // bounding box for stripes (cube)
const cubeMin = 0;
const cubeMax = initialDroneY + areaSize / 2;
const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
for (let i = 0; i < numStripes; i++) {
  const geom = new THREE.BoxGeometry(stripeLength, stripeHeight, stripeWidth);
  const mesh = new THREE.Mesh(geom, stripeMaterial.clone());
  // Random initial position within 3D cube
  mesh.position.x = THREE.MathUtils.lerp(-areaSize / 2, areaSize / 2, Math.random());
  mesh.position.y = THREE.MathUtils.lerp(0, cubeMax, Math.random());
  mesh.position.z = THREE.MathUtils.lerp(-areaSize / 2, areaSize / 2, Math.random());
  windStripes.push(mesh);
  scene.add(mesh);
}

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);

  if (isPlaying) {
    if (lastTime === null) lastTime = time;
    const dt = (time - lastTime) / 1000; // seconds
    lastTime = time;

    // Simulate physics
    const inputs = {
      windX: wind.x,
      windY: wind.y,
      windZ: wind.z
    };

    const kvals = {
      kp: 1.0,
      kd: 0.01,
      ki: 0.01
    }

    // Get force matrix from calcForces
    let forceMatrix = calcForces(droneState, inputs, time);
    // let forceMatrix = [
    //   [0,0.1,0],
    //   [0,0.1,0],
    //   [0,0,0],
    //   [0,0,0],
    //   [0,0,0]
    // ];
    // console.log("Force Matrix Before: ", JSON.parse(JSON.stringify(forceMatrix))); // Deep copy for logging
    
    let compensatorMatrix = getCompMatrix(droneState, kvals, dt);
    // compensatorMatrix = [0,0,0,0];
    console.log("Compensator Matrix: ", compensatorMatrix);
    const R = getR(droneState.roll,droneState.pitch,droneState.yaw);
    console.log(R);
    for (let i = 0; i < compensatorMatrix.length; i++) {
      // convert upward comp (body) force to inertial frame force
      // const propForceBody = new THREE.Vector3(0,compensatorMatrix[i],0);
      // const inertialPropForce = propForceBody.clone().applyMatrix3(R);

      console.log(inertialPropForce);
      

      forceMatrix[i][0] += inertialPropForce.x;
      forceMatrix[i][1] += inertialPropForce.y;
      forceMatrix[i][2] += inertialPropForce.z;
      // console.log(`forceMatrix[${i}][1] is now ${forceMatrix[i][1]}`);
    }
    
    console.log("Force Matrix After: ", JSON.parse(JSON.stringify(forceMatrix))); // Deep copy for logging
    inputs.forceMatrix = forceMatrix;

    const deltas = simulateDronePhysics(droneState, inputs, dt);

    // Integrate state
    droneState.vx += deltas.dvx;
    droneState.vy += deltas.dvy;
    droneState.vz += deltas.dvz;
    droneState.x += droneState.vx * dt;
    droneState.y += droneState.vy * dt;
    droneState.z += droneState.vz * dt;
    
    // Integrate angular velocities and orientations
    droneState.wx += deltas.dwx;
    droneState.wy += deltas.dwy;
    droneState.wz += deltas.dwz;
    droneState.roll += droneState.wx * dt;
    droneState.pitch += droneState.wz * dt;
    droneState.yaw += droneState.wy * dt;

    // Prevent drone from falling through the platform (y=0.15 is top of platform)
    if (droneState.y < 0.15) {
      droneState.y = 0.15;
      droneState.vy = 0;
    }
    console.log(drone.rotation);
    if (drone) {
      drone.position.set(droneState.x, droneState.y, droneState.z);
      // Apply orientation to drone model
      drone.rotation.set(droneState.roll, droneState.yaw, droneState.pitch);
    }
  }

  updateTelemetry();
  renderer.render(scene, camera);
  controls.update();

  // Animate wind stripes
  const windVec = new THREE.Vector3(wind.x, wind.y, wind.z);
  const windSpeed = windVec.length();
  if (windSpeed > 0.01) {
    const windDir = windVec.clone().normalize();
    for (const stripe of windStripes) {
      // Move stripe in wind direction, scale by wind speed
      stripe.position.x += windDir.x * windSpeed * 0.04;
      stripe.position.y += windDir.y * windSpeed * 0.04;
      stripe.position.z += windDir.z * windSpeed * 0.04;
      // Orient stripe to match wind direction (XZ plane)
      const angle = Math.atan2(windDir.z, windDir.x);
      const yangle = Math.atan2(windDir.y, windDir.x);
      stripe.rotation.set(0, -angle, yangle);

      const xmin = droneState.x - areaSize / 2;
      const xmax = droneState.x + areaSize / 2;
      const ymin = droneState.y - areaSize / 2;
      const ymax = droneState.y + areaSize / 2;
      const zmin = droneState.z - areaSize / 2;
      const zmax = droneState.z + areaSize / 2;
      // Wrap around if out of bounds in all 3D
      if (stripe.position.x < xmin) stripe.position.x += areaSize;
      if (stripe.position.x > xmax) stripe.position.x -= areaSize;
      if (stripe.position.y < ymin) stripe.position.y += areaSize;
      if (stripe.position.y > ymax) stripe.position.y -= areaSize;
      if (stripe.position.z < zmin) stripe.position.z += areaSize;
      if (stripe.position.z > zmax) stripe.position.z -= areaSize;
    }
  }

  // Render axis indicator in top right
  // Remove axis indicator rendering in animate()
  // labelRenderer.render(axisScene, axisCamera);
}
requestAnimationFrame(animate);

// Wind control panel UI
const windPanel = document.createElement('div');
windPanel.id = 'wind-panel';
windPanel.innerHTML = `
  <h2>Wind Control</h2>
  <div class="wind-input-group">
    <label for="wind-x-num">Wind X</label>
    <input type="number" id="wind-x-num" min="-10" max="10" step="0.1" value="0.1">
  </div>
  <div class="wind-input-group">
    <label for="wind-y-num">Wind Y</label>
    <input type="number" id="wind-y-num" min="-10" max="10" step="0.1" value="0.1">
  </div>
  <div class="wind-input-group">
    <label for="wind-z-num">Wind Z</label>
    <input type="number" id="wind-z-num" min="-10" max="10" step="0.1" value="0.1">
  </div>
`;
document.body.appendChild(windPanel);
// Restore panel open/close logic
let windPanelOpen = false;
function openWindPanel() {
  windPanel.classList.add('open');
  windPanelOpen = true;
}
function closeWindPanel() {
  windPanel.classList.remove('open');
  windPanelOpen = false;
}
// Open when mouse is near left edge
window.addEventListener('mousemove', (e) => {
  if (!windPanelOpen && e.clientX < 30) openWindPanel();
  // Close if mouse moves away from left edge and not over the panel
  if (windPanelOpen && e.clientX > 230 && !windPanel.matches(':hover')) closeWindPanel();
});
// Close when mouse leaves the panel
windPanel.addEventListener('mouseleave', () => {
  closeWindPanel();
});

// Wind input logic
function bindWindInput(axis) {
  const num = document.getElementById(`wind-${axis}-num`);
  num.addEventListener('input', () => {
    wind[axis] = parseFloat(num.value);
  });
}
bindWindInput('x');
bindWindInput('y');
bindWindInput('z'); 