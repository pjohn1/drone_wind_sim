// physics_sim.js
// Simulate drone physics and output velocity and orientation changes

/**
 * Simulate drone physics for a single time step.
 * @param {Object} state - The current state of the drone.
 *   { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz }
 * @param {Object} inputs - Control inputs and environment (e.g., wind velocity, torques).
 *   { windX, windY, windZ, tx, ty, tz, mass, gravity }
 * @param {number} dt - Time step in seconds.
 * @returns {Object} - Matrix/object with velocity and orientation deltas.
 *   { dvx, dvy, dvz, dwx, dwy, dwz }
 */

const mass = 0.515;
const Ixx = 0.0023;
const Iyy = 0.0023; 
const Izz = 0.0040;
const d = 0.215; // m, distance between CG and rotor
const gravity = 9.8; // m/s^2 (downwards)

export function simulateDronePhysics(state, inputs, dt) {
  // Unpack state
  const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
  const { windX, windY, windZ, forceMatrix } = inputs;

  // Calculate net force from the 5x3 force matrix
  // forceMatrix format: [rotor1, rotor2, rotor3, rotor4, body] each with [fx, fy, fz]
  let netFx = 0, netFy = 0, netFz = 0;
  let netTx = 0, netTy = 0, netTz = 0;

  if (forceMatrix && forceMatrix.length === 5) {
    const d_vert = d / Math.sqrt(2);
    
    // Rotor positions relative to CG: [top-left, top-right, bottom-right, bottom-left, body]
    const rotorPositions = [
      [d_vert, 0, -d_vert],   // top-left
      [d_vert, 0, d_vert],    // top-right  
      [-d_vert, 0, d_vert],   // bottom-right
      [-d_vert, 0, -d_vert],  // bottom-left
      [0, 0, 0]               // body (CG)
    ];

    // Sum forces and calculate torques
    for (let i = 0; i < 5; i++) {
      const [fx, fy, fz] = forceMatrix[i];
      const [rx, ry, rz] = rotorPositions[i];
      
      // Add to net force
      netFx += fx;
      netFy += fy;
      netFz += fz;
      
      // Calculate torque: τ = r × F
      netTx += ry * fz - rz * fy;
      netTy += rz * fx - rx * fz;
      netTz += rx * fy - ry * fx;
    }
  }



  // Linear acceleration (F = ma) in inertial frame
  const ax = netFx / mass;
  const ay = netFy / mass; //- gravity;
  const az = netFz / mass;

  // console.log("Torques: ",netTx,netTy,netTz);
  // Angular acceleration (τ = Iα)
  const alphaX = netTx / Ixx;
  const alphaY = netTy / Iyy;
  const alphaZ = netTz / Izz;

  // Integrate velocities
  const dvx = ax * dt;
  const dvy = ay * dt;
  const dvz = az * dt;

  // Integrate angular velocities
  const dwx = alphaX * dt;
  const dwy = 0;//alphaY * dt;
  const dwz = alphaZ * dt;

  return {
    dvx, dvy, dvz,
    dwx, dwy, dwz
  };


} 