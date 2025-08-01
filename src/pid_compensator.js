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


export function getCompMatrix(state, inputs, last_state, dt) {
  // Unpack state
  const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
  const { kp, ki, kd} = inputs;
  console.log("kd: ",inputs.kd);
  console.log("dt: ",dt);
  let e = [state.x,state.y,state.z,state.vx,state.vy,state.vz,state.roll,state.pitch,state.yaw,state.wx,state.wy,state.wz];
  e = e.map(ang =>
    {
      return wrapToPi(ang);
    } );
  let last_e = [last_state.x,last_state.y,last_state.z,last_state.vx,last_state.vy,last_state.vz,last_state.roll,last_state.pitch,last_state.yaw,last_state.wx,last_state.wy,last_state.wz];
  last_e = last_e.map(ang =>
    {
      return wrapToPi(ang);
    } );

  let derror = [];
  for (let i=0;i<e.length;i++)
  {
    derror.push(e[i] - last_e[i]);
  }
  console.log("derror: ",derror);
  // console.log('e before: ', e);
  
  // console.log('e after: ',error);

  const forces = [0.0,0.0,0.0,0.0]
  // pitch control
  const P_pitch = inputs.kp * -state.pitch; // just looking for pitch control
  const D_pitch = dt !== 0 ? inputs.kd * -derror[7] / dt : 0;
  console.log("D_pitch: ",D_pitch);
  forces[0] += (P_pitch + D_pitch) / 4;
  forces[1] += (P_pitch + D_pitch) / 4;
  forces[2] -= (P_pitch + D_pitch) / 4;
  forces[3] -= (P_pitch + D_pitch) / 4;

  // roll control
  const P_roll = inputs.kp * -state.roll;
  const D_roll = dt !== 0 ? inputs.kd * -derror[6] / dt : 0;
  forces[0] += (P_roll + D_roll) / 4;
  forces[1] -= (P_roll + D_roll) / 4;
  forces[2] -= (P_roll + D_roll) / 4;
  forces[3] += (P_roll + D_roll) / 4;

  // console.log("PID forces: ", forces);


  return forces;

} 