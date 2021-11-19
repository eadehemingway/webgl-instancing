const REGL = require("regl");
const cube = require("./cube");
const { mat4 } = require("gl-matrix"); // has bunch of stock standard mat's for working with matrices
// we are using it for transformations to alter the canvas proportions so that a square is a square
// mat4 is a matrix with 4 rows and 4 columns, (so 16 numbers) we are using a mat4 because we working with a vec4 (gl_position)
// we want to transform the current gl_position into a new gl_position that is correctly proportioned.

const regl = REGL({
    extensions: ["ANGLE_instanced_arrays"] // this makes the instancing work
});

const instances = 100000;
const buffer_color = [];
const buffer_offset = [];
const buffer_radius_scale = [];

for (var i = 0; i < instances; i ++){
    const col = [Math.random(), Math.random(), Math.random()];
    // we need the offset to be between -1 and 1 so we times by two and minus one
    const offset = [(Math.random()*2) -1, (Math.random()*2)-1, (Math.random()*2)-1 ];
    const rad = [Math.random()/100];

    buffer_color.push(col);
    buffer_offset.push(offset);
    buffer_radius_scale.push(rad);
}
const projection_matrix = mat4.create(); // mat4.create() returns mat4 identity (i.e. it just returns the same thing it gets in)
const view_matrix = mat4.create(); // for camera position

const drawPoints = regl({
    instances: instances, // this says we want two instances (i.e. two circles)
    count: cube.positions.length / 3, // we are no longer using elements so we are using count again
    attributes: {
    // attributes can be called anything, but the options they take are all the same (they have buffer and divisor). If they dont have a divisor
    // then you can do it in an array e.g. position below:
        position: cube.positions, // the corner points of the triangle of the three d cube. order of these is important!
        normal: cube.normals,
        // (regular attributes have a divisor of zero, only instance attributes have a divisor of one)
        color: {
            buffer: buffer_color, // red and blue
            divisor: 1 // this turns on instancing (i.e. use the following code as a template that will be called many times)
        },
        offset: {
            buffer: buffer_offset,
            divisor: 1
        },
        radiusScale: {
            buffer: buffer_radius_scale,
            divisor: 1
        }
    },
    cull: {
        enable:false
    },
    uniforms: {
        projection_matrix: ()=> projection_matrix,
        view_matrix: ()=> view_matrix,
        u_time: regl.context("time")
    },
    vert: `
        precision mediump float;
        attribute vec3 position;
        attribute vec3 normal;
        varying vec3 v_normal;
        varying vec3 v_position;
        uniform mat4 projection_matrix;
        attribute vec3 color;
        varying vec3 v_color;
        attribute vec3 offset;
        attribute float radiusScale;
        uniform float u_time;
        uniform mat4 view_matrix;

        ${require("./noise")}

        void main(){
            v_color = color;
            v_normal = normal;
            // // this says how broken up the noise is. The smaller this number the fewer bigger mountains there will be,
            // // the larger the number the more mountains they will be (and they will have more of a vertical drop)
            float noise_fragment = 100.0;
            vec3 noise_coordinate = offset * noise_fragment;
            // float noise_amplitude = snoise(vec3(noise_coordinate));
            // v_color = vec3( noise_amplitude * 0.5 + 0.5); //  * 0.5 + 0.5 this turns the numbers from (-1, 1) to (0, 1)

            v_position = position;
            vec3 offset_position = (position * radiusScale) + offset; // by timesing position by radius scale we pull in/out the corners of the square and therefore make circle bigger/smaller

            // snoise returns a float
            float speed = 0.1;


            offset_position.x += snoise(vec3(noise_coordinate + 0.34));
            offset_position.y += snoise(vec3(noise_coordinate + 0.57));
            offset_position.z += snoise(vec3(noise_coordinate + 0.987));

            gl_Position = vec4(offset_position, 1.0);
            gl_Position = projection_matrix * view_matrix * gl_Position; // this is the gl position transformed by projection matrix and the view matrix
        }
    `,
    frag: `
        precision mediump float;
        varying vec3 v_color;
        varying vec3 v_normal;

        void main(){
        // the  * 0.5 + 0.5 is to take it from (-1, 1) to (0, 1)
            gl_FragColor = (vec4(v_normal * 0.5 + 0.5, 1.0));

        }

    `,


});

function render(){
    const green = [0.2, 0.5, 0.4, 1.0];
    regl.clear({ color: green });
    mat4.identity(projection_matrix); // this resets the matrix to the original mat4 identity matrix,
    // so if we need to update the transofmraiton (e.g. for screen resize) it will just do the right amount (cos its cummulative)
    mat4.scale(projection_matrix, projection_matrix, [0.5, 0.5, 1.0]); // projection_matrix is passed in twice because its both the matrix we are reading from and the one we are writing to
    const ratio = window.innerWidth/ window.innerHeight;

    const field_of_view = Math.PI/4; // 8th of a circle in radians
    // mat4.perspective(matrix_to_alter, field_of_view, aspect_ratio, near, far);
    mat4.perspective(projection_matrix, field_of_view, ratio, 0.01, 10.0); // adds concept of perspective (objcts getting bigger as they get closer)

    mat4.identity(view_matrix);
    mat4.rotateY(view_matrix, view_matrix, Date.now()/100000);

    drawPoints();

}

regl.frame(render);