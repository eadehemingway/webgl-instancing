const REGL = require("regl");

const regl = REGL({});



const drawPoints = regl({
    count: 6, // amount of points we are going to draw. 
    attributes: {
        position: [[-1, -1], [1, -1], [1, 1], [1, 1], [-1, 1], [-1, -1]]
    }, 
    uniforms: {},
    vert: `
        precision mediump float;
        attribute vec2 position;
        varying vec2 v_position;
        
        void main(){
            v_position = position;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `,
    frag: `
        precision mediump float;
        varying vec2 v_position;
        
        void main(){
            // length(v_position) = length from origin
            float length_from_origin = length(v_position);
            float radius = 1.0;
            
            float outside_circle = step(radius, length_from_origin); // return 1 if it is outside the circle
            float inside_circle = 1.0 - outside_circle; // will return 1.0 if it is inside the circle
            gl_FragColor = vec4(0.0, 0.0, inside_circle, 1.0);
    
        }
    
    `, 

});

function render(){

    regl.clear({color: [0.2, 0.5, 0.4, 1.0]});
    
    drawPoints();

}

regl.frame(render);