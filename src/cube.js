const unindex = require("unindex-mesh");
const faceNormals = require("face-normals");

const indexed_cube = {
    cells: [
        [1, 0, 2],
        [3, 1, 2],
        [4, 5, 6],
        [5, 7, 6],
        [0, 1, 5],
        [4, 0, 5],
        [1, 3, 5],
        [3, 7, 5],
        [2, 0, 4],
        [2, 4, 6],
        [2, 6, 3],
        [6, 7, 3]
    ],
    positions: [
        [0, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [1, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 1, 0],
        [1, 1, 1]
    ]
};

// position without cells, unindexed, full list of triangles
const triangle_soup_cube = unindex(indexed_cube.positions, indexed_cube.cells);
const normals = faceNormals(triangle_soup_cube);

module.exports = {
    positions: triangle_soup_cube,
    normals: normals,
};