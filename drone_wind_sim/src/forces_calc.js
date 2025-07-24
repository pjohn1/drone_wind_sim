
// pid_control.js
// Simulate drone physics and output velocity and orientation changes

/**
 * Simulate drone physics for a single time step.
 * @param {Object} inputs - Environmental forces (e.g., wind velocity, torques).
 *   { windX, windY, windZ }
 * @param {number} dt - Time step in seconds.
 * @returns {Object} - Matrix/object with velocity and orientation deltas.
 *   {fx,fy,fz,tx,ty,tz}
 */

const mass = 0.515;
const Ixx=.0023;const Iyy=.0023;const Izz=.0040;
const d = 0.215; //m, distance between CG and rotor
const gravity = 9.8; // m/s^2 (downwards)
const Cd = 1.2;

const body_width = 0.15; //m
const body_height = 0.05; //m
const body_area = body_width * body_height;

const rotor_radius = 0.075; //m
const rotor_area = Math.PI*rotor_radius**2;

const area_matrix = [body_area, (body_area + 4*rotor_area), body_area];

export function calcForces(state, inputs, dt) {
    const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
    const { windX, windY, windZ } = inputs;

    
}