const REGL = require("regl");

const regl = REGL({});



const drawPoints = regl({
    vert: `
    attribute vec2 position;
    
    void main(){
    
    gl_Position = vec4(position, 0.0, 1.0);
    }
    `,
    frag: `
    
    void main(){
    
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    }
    
    `, 
    count: 6, // amount of points we are going to draw. 
    attributes: {
        position: [[-1, -1], [1, -1], [1, 1], [1, 1], [-1, 1], [-1, -1]]
    }, 
    uniforms: {}
});

function render(){

    regl.clear({color: [0.2, 0.5, 0.4, 1.0]});
    
    drawPoints();

}

regl.frame(render);