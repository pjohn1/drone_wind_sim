import * as THREE from 'three';

export function getR(roll, pitch, yaw)
{
    const cos = Math.cos; const sin = Math.sin;
    const c_phi = cos(roll); const s_phi = sin(roll);
    const c_theta = cos(pitch); const s_theta = sin(pitch);
    const c_psi = cos(yaw); const s_psi = sin(yaw);

    console.log(c_phi,s_phi,c_theta,s_theta,c_psi,s_psi);

    const R = new THREE.Matrix3();
    R.set(
        c_psi*c_theta, c_psi*s_theta + s_phi * c_phi, c_psi*s_theta*c_phi - s_psi * s_phi,
        -s_theta, c_theta*s_phi, c_theta*c_phi,
        -s_psi*c_theta, -s_psi*s_theta*s_phi + c_psi*c_phi, -s_psi*s_theta*c_phi - c_psi*s_phi
    );
    return R;
}

export default getR;