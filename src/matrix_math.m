%% linearized rotation matrix
syms phi psi theta

Ry = [-psi 0 1;
    0 1 0;
    1 0 psi;];

Rz = [1 theta 0;
    -theta 1 0;
    0 0 1];

Rx = [1 0 0;
    0 1 -phi;
    0 1 phi];

R = Ry * Rz * Rx
%%