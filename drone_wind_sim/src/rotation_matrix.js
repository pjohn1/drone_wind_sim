import * as THREE from 'three';

export function getR(roll, pitch, yaw)
{
    const cos = Math.cos; const sin = Math.sin;
    const c_phi = cos(roll); const s_phi = sin(roll);
    const c_theta = cos(pitch); const s_theta = sin(pitch);
    const c_psi = cos(yaw); const s_psi = sin(yaw);

    console.log(c_phi,s_phi,c_theta,s_theta,c_psi,s_psi);

    const Ry = new THREE.Matrix3();
    const Rz = new THREE.Matrix3();
    const Rx = new THREE.Matrix3();

    // R = Ry*Rz*Rx (x forward, y up, z left)

    Ry.set(
        -s_psi, 0, c_psi,
        0, 1, 0,
        c_psi, 0, s_psi
    );

    Rz.set(
        c_theta, s_theta, 0,
        -s_theta, c_theta, 0,
        0, 0, 1
    );

    Rx.set(
        1, 0, 0,
        0, c_phi, -s_phi,
        0, s_phi, c_phi
    );

    const R_mid = Ry.clone().multiply(Rz);
    const R = R_mid.clone().multiply(Rx);

    return R;


}

export default getR;