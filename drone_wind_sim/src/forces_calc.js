
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
import GustField from './gust_field.js';


const mass = 0.515;
const Ixx=.0023;const Iyy=.0023;const Izz=.0040;
const d = 0.215; //m, distance between CG and rotor
const gravity = 9.8; // m/s^2 (downwards)
const Cd = 1.2;
const rho = 1.225;

const body_width = 0.15; //m
const body_height = 0.05; //m
const body_area = body_width * body_height;

const rotor_radius = 0.075; //m
const rotor_height = 0.08; //m
const Ay = Math.PI*rotor_radius**2;
const Aside = Math.PI*rotor_radius*rotor_height;

export function calcForces(state, inputs, t) {
    // console.log(t);
    const { x, y, z, vx, vy, vz, roll, pitch, yaw, wx, wy, wz } = state;
    const { windX, windY, windZ } = inputs;

    const gust = new GustField();
    const globalWind = [inputs.windX, inputs.windY, inputs.windZ];

    const d_vert = d/(2**(1/2));

    const rotorPositions = [
        [d_vert, 0,-d_vert],
        [d_vert, 0,d_vert],
        [-d_vert,0,d_vert],
        [-d_vert,0,-d_vert],
        [0,0,0]
    ]; //f1,f2,f3,f4,fb

    let rotorGusts = [];
    for (let i=0;i<rotorPositions.length;i++)
    {
        const gustVec = gust.evaluate(rotorPositions[i],t,globalWind);
        let gustArr;
        gustArr = [
            gustVec[0] + globalWind[0],
            gustVec[1] + globalWind[1],
            gustVec[2] + globalWind[2]
        ];

        rotorGusts.push(gustArr);
    }
    // console.log(rotorGusts);
    // const rotorGusts = rotorPositions.map(pos => {
    //     const gustVec = gust.evaluate(pos,t);
        
    //     return [
    //         gustVec[0] + globalWind[0],
    //         gustVec[1] + globalWind[1],
    //         gustVec[2] + globalWind[2]
    //     ];
    //     // return [
    //     //     globalWind[0],
    //     //     globalWind[1],
    //     //     globalWind[2]
    //     // ]
    // });

    let f = [];

    for (let i=0;i<4;i++)
    {
        const gustVec = rotorGusts[i];
        const f_x = gustVec[0] !== 0 ? (gustVec[0]/Math.abs(gustVec[0])) * Cd*rho*Aside*gustVec[0]**2 : 0;
        const f_y = gustVec[1] !== 0 ? (gustVec[1]/Math.abs(gustVec[1])) * Cd*rho*Ay*gustVec[1]**2 : 0;
        const f_z = gustVec[2] !== 0 ? (gustVec[2]/Math.abs(gustVec[2])) * Cd*rho*Aside*gustVec[2]**2 : 0;
        
        f.push([f_x,f_y,f_z]);
    }
    // estimate body CS as a rectangle with width 7.5cm * height 5cm
    const Abody = .075 * .05;
    const gustVec = rotorGusts[4];
    const f_x = gustVec[0] !== 0 ? (gustVec[0]/Math.abs(gustVec[0])) * Cd*rho*Abody*gustVec[0]**2 : 0;
    const f_y = gustVec[1] !== 0 ? (gustVec[1]/Math.abs(gustVec[1])) * Cd*rho*Abody*gustVec[1]**2 : 0;
    const f_z = gustVec[2] !== 0 ? (gustVec[2]/Math.abs(gustVec[2])) * Cd*rho*Abody*gustVec[2]**2 : 0;
    f.push([f_x,f_y,f_z]);

    // console.log("Forces before: ", f);
    return f;

    
}