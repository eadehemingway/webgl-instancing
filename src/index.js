const REGL = require("regl");
const { mat4 } = require("gl-matrix"); // has bunch of stock standard mat's for working with matrices
// we are using it for transformations to alter the canvas proportions so that a square is a square
// mat4 is a matrix with 4 rows and 4 columns, (so 16 numbers) we are using a mat4 because we working with a vec4 (gl_position)
// we want to transform the current gl_position into a new gl_position that is correctly proportioned.

const regl = REGL({
    extensions: ["ANGLE_instanced_arrays"] // this makes the instancing work
});


const projection_matrix = mat4.create(); // this returns mat4 identity (i.e. it just returns the same thing it gets in)

const drawPoints = regl({
    instances: 2, // this says we want two instances (i.e. two circles)
    count: 6, // amount of points we are going to draw.
    attributes: {
    // attributes can be called anything, but the options they take are all the same (they have buffer and divisor). If they dont have a divisor
    // then you can do it in an array e.g. position below:
        position: [[-1, -1], [1, -1], [1, 1], [1, 1], [-1, 1], [-1, -1]], // this is shorthand for doing an object with buffer without a divisor
        // (regular attributes have a divisor of zero, only instance attributes have a divisor of one)
        color: {
            buffer: [[1, 0, 0],[ 0, 0, 1]], // red and blue
            divisor: 1 // this turns on instancing (i.e. use the following code as a template that will be called many times)
        },
        offset: {
            buffer: [[-1, 0], [1, 0]],
            divisor: 1
        }
    },
    uniforms: {
        projection_matrix: ()=> projection_matrix
    },
    vert: `
        precision mediump float;
        attribute vec2 position;
        varying vec2 v_position;
        uniform mat4 projection_matrix;
        attribute vec3 color;
        varying vec3 v_color;
        attribute vec2 offset;


        void main(){
            v_color = color;
            v_position = position;
            gl_Position = vec4(position + offset, 0.0, 1.0);
            gl_Position = projection_matrix * gl_Position; // this is the gl position transformed by the mat4
        }
    `,
    frag: `
        precision mediump float;
        varying vec2 v_position;
        vec3 sienna = vec3(0.725, 0.345, 0.207);
        varying vec3 v_color;

        void main(){
            // length(v_position) = length from origin
            float length_from_origin = length(v_position);
            float radius = 1.0;

            float outside_circle = step(radius, length_from_origin); // return 1 if it is outside the circle
            float inside_circle = 1.0 - outside_circle; // will return 1.0 if it is inside the circle
            float alpha = inside_circle; // if point is inside circle we want alpha to be 1, if it is outside circle we want it to be zero (same as inside_circle)
            gl_FragColor = vec4(v_color, alpha);

        }

    `,
    blend:  { // this object is copied pasted, this sets up behaviour between
    // source and destination colors. it makes transparency possible
        enable: true,
        func: {
            srcRGB: "src alpha",
            dstRGB: "one minus src alpha",
            srcAlpha: "src alpha",
            dstAlpha: "one minus src alpha"
        },
        equation: {
            rgb: "add",
            alpha: "add"
        }
    },

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