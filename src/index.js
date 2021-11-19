const REGL = require("regl");
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
const projection_matrix = mat4.create(); // this returns mat4 identity (i.e. it just returns the same thing it gets in)

const drawPoints = regl({
    instances: instances, // this says we want two instances (i.e. two circles)
    count: 6, // amount of points we are going to draw.
    attributes: {
    // attributes can be called anything, but the options they take are all the same (they have buffer and divisor). If they dont have a divisor
    // then you can do it in an array e.g. position below:
        position: [[-1, -1], [1, -1], [1, 1], [1, 1], [-1, 1], [-1, -1]], // this is shorthand for doing an object with buffer without a divisor
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
    uniforms: {
        projection_matrix: ()=> projection_matrix,
        u_time: regl.context("time")
    },
    vert: `
        precision mediump float;
        attribute vec2 position;
        varying vec2 v_position;
        uniform mat4 projection_matrix;
        attribute vec3 color;
        varying vec3 v_color;
        attribute vec3 offset;
        attribute float radiusScale;
        uniform float u_time;

        ${require("./noise")}

        void main(){
            v_color = color;
            // // this says how broken up the noise is. The smaller this number the fewer bigger mountains there will be,
            // // the larger the number the more mountains they will be (and they will have more of a vertical drop)
            float noise_fragment = 100.0;
            vec3 noise_coordinate = offset * noise_fragment;
            // float noise_amplitude = snoise(vec3(noise_coordinate));
            // v_color = vec3( noise_amplitude * 0.5 + 0.5); //  * 0.5 + 0.5 this turns the numbers from (-1, 1) to (0, 1)

            v_position = position;
            vec3 offset_position = (vec3(position, 0.0) * radiusScale) + offset; // by timesing position by radius scale we pull in/out the corners of the square and therefore make circle bigger/smaller

            // snoise returns a float
            float speed = 0.1;


            offset_position.x += snoise(vec3(noise_coordinate + 0.34));
            offset_position.y += snoise(vec3(noise_coordinate + 0.57));
            offset_position.z += snoise(vec3(noise_coordinate + 0.987));

            gl_Position = vec4(offset_position, 1.0);
            gl_Position = projection_matrix * gl_Position; // this is the gl position transformed by the mat4
        }
    `,
    frag: `
        precision mediump float;
        varying vec3 v_color;

        void main(){
            gl_FragColor = (vec4(v_color, 1.0));

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
    // mat4.ortho(transformation_matrix, left, right, up, down, near, far) // defining a cube for the edges of the scene
    mat4.ortho(projection_matrix, -ratio , ratio, 1.0, -1.0, -1.0, 1.0);
    drawPoints();

}

regl.frame(render);