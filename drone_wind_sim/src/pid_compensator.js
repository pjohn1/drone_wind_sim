// physics_sim.js
// Simulate drone physics and output velocity and orientation changes

/**
 * Simulate drone physics for a single time step.
 * @param {Object} state - The current state of the drone.
 *   { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz }
 * @param {Object} inputs - Control inputs and environment (e.g., wind velocity, torques).
 *   { kp,ki,kd }
 * @param {number} dt - Time step in seconds.
 * @returns {Object} - Compensator force matrix (only acts in y-direction)
 * { f1, f2, f3, f4 }
 */

const mass = 0.515;
const Ixx = 0.0023;
const Iyy = 0.0023; 
const Izz = 0.0040;
const d = 0.215; // m, distance between CG and rotor
const gravity = 9.8; // m/s^2 (downwards)

function wrapToPi(angle) {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}


export function getCompMatrix(state, inputs, dt) {
  // Unpack state
  const { roll, pitch, yaw, wx, wy, wz } = state;
  const { kp, ki, kd} = inputs;
  const e = [state.roll,state.yaw,state.pitch,state.wx,state.wy,state.wz];
  console.log('e before: ', e);
  const error = e.map(ang =>
    {
      return wrapToPi(ang);
    } );
  
  console.log('e after: ',error);

  const forces = [0.0,0.0,0.0,0.0]
  // pitch control
  const P_pitch = inputs.kp * -error[2];
  forces[0] += P_pitch / 4;
  forces[1] += P_pitch / 4;
  forces[2] -= P_pitch / 4;
  forces[3] -= P_pitch / 4;

  // yaw control
  const P_yaw = inputs.kp * -error[1];
  forces[0] -= P_yaw / 4;
  forces[1] += P_yaw / 4;
  forces[2] -= P_yaw / 4;
  forces[3] += P_yaw / 4;

  // roll control
  const P_roll = inputs.kp * -error[0];
  forces[0] += P_roll / 4;
  forces[1] -= P_roll / 4;
  forces[2] -= P_roll / 4;
  forces[3] += P_roll / 4;

  // console.log("PID forces: ", forces);


  return forces;

} 