// physics.js
// Simulate drone physics and output velocity and orientation changes

/**
 * Simulate drone physics for a single time step.
 * @param {Object} state - The current state of the drone.
 *   { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz }
 * @param {Object} inputs - Control inputs and environment (e.g., forces, torques, wind).
 *   { fx, fy, fz, tx, ty, tz, mass, gravity }
 * @param {number} dt - Time step in seconds.
 * @returns {Object} - Matrix/object with velocity and orientation deltas.
 *   { dx, dy, dz, dvx, dvy, dvz, droll, dpitch, dyaw, dwx, dwy, dwz }
 */

const mass = 1;
const Ixx=1;const Iyy=1;const Izz=1;
const gravity = -9.8; // m/s^2 (downwards)

export function simulateDronePhysics(state, inputs, dt) {
  // Unpack state
  const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
  const { fx = 0, fy = 0, fz = 0, tx = 0, ty = 0, tz = 0, mass = 1, gravity = -9.8 } = inputs;

  // Linear acceleration
  const ax = fx / mass;
  const ay = (fy / mass) + gravity;
  const az = fz / mass;

  // Angular acceleration (simplified, no inertia tensor)
  const alphaX = tx / mass;
  const alphaY = ty / mass;
  const alphaZ = tz / mass;

  // Integrate velocities
  const dvx = ax * dt;
  const dvy = ay * dt;
  const dvz = az * dt;

  // Integrate angular velocities
  const dwx = alphaX * dt;
  const dwy = alphaY * dt;
  const dwz = alphaZ * dt;

  // Integrate positions
  const dx = vx * dt + 0.5 * ax * dt * dt;
  const dy = vy * dt + 0.5 * ay * dt * dt;
  const dz = vz * dt + 0.5 * az * dt * dt;

  // Integrate orientation (Euler angles, simplified)
  const droll = wx * dt + 0.5 * alphaX * dt * dt;
  const dpitch = wy * dt + 0.5 * alphaY * dt * dt;
  const dyaw = wz * dt + 0.5 * alphaZ * dt * dt;

  return {
    dx, dy, dz,
    dvx, dvy, dvz,
    droll, dpitch, dyaw,
    dwx, dwy, dwz
  };
} 