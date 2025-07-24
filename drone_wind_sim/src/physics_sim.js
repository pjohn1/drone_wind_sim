// physics.js
// Simulate drone physics and output velocity and orientation changes

/**
 * Simulate drone physics for a single time step.
 * @param {Object} state - The current state of the drone.
 *   { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz }
 * @param {Object} inputs - Control inputs and environment (e.g., wind velocity, torques).
 *   { windX, windY, windZ, tx, ty, tz, mass, gravity }
 * @param {number} dt - Time step in seconds.
 * @returns {Object} - Matrix/object with velocity and orientation deltas.
 *   {dvx, dvy, dvz, dwx, dwy, dwz }
 */

const mass = 0.515;
const Ixx=.0023;const Iyy=.0023;const Izz=.0040;
const d = 0.215; //m, distance between CG and rotor
const gravity = 9.8; // m/s^2 (downwards)

export function simulateDronePhysics(state, inputs, dt) {
  // Unpack state
  const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
  const { f1=0, f2=0, f3=0, f4=0 } = inputs;
  // const { windX = 0, windY = 0, windZ = 0 } = inputs;

  // Linear acceleration: wind is modeled as a direct addition to velocity
  // (for a more realistic model, wind would be a force, but here we treat it as a velocity offset)
  const ax = windX;
  const ay = windY - gravity;
  const az = windZ;

  // console.log(windX, windY, windZ);
  // Integrate velocities (add wind velocity directly)
  const dvx = ax * dt;
  const dvy = ay * dt;
  const dvz = az * dt;


  // Integrate angular velocities (no wind effect for now)
  const alphaX = tx / mass;
  const alphaY = ty / mass;
  const alphaZ = tz / mass;
  const dwx = alphaX * dt;
  const dwy = alphaY * dt;
  const dwz = alphaZ * dt;

  return {
    dvx, dvy, dvz,
    dwx, dwy, dwz
  };
} 