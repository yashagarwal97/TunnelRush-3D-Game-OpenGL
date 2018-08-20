//var obstacle_Rotation = 0.0;
var t_count = 0;
var game_over = 0;
//var obstacle_Translation = -100.0;
var obstacle_Translation = [];
var obstacle_Rotation = [];

//
// Start here
//
/*
Mousetrap.bind('a', function () {
   cubeRotation+=0.05;
})

Mousetrap.bind('d', function () {
  cubeRotation-=0.05;
})
*/
 var y,temp=-100.0;;
for(y=0;y<3;y++)
{
  obstacle_Translation[y]=temp;
  temp-=200.0;
  obstacle_Rotation[y]=0.0;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers1(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.
/*
  const positions = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];
*/
  
var i,j,k; 
const obstacles = [
    // Front face
    -0.5, -2.0,  0.5,
    -0.5,  2.0,  0.5,
     0.5,  2.0,  0.5,
     0.5, -2.0,  0.5,

    // Back face
     0.5, -2.0, -0.5,
    -0.5,  2.0, -0.5,
     0.5,  2.0, -0.5,
    -0.5, -2.0, -0.5,

    // Top face
    -0.5,  2.0, -0.5,
     0.5,  2.0,  0.5,
    -0.5,  2.0,  0.5,
     0.5,  2.0, -0.5,

    // Bottom face
    -0.5, -2.0, -0.5,
     0.5, -2.0, -0.5,
     0.5, -2.0,  0.5,
    -0.5, -2.0,  0.5,

    // Right face
     0.5, -2.0, -0.5,
     0.5,  2.0,  0.5,
     0.5,  2.0, -0.5,     
     0.5, -2.0,  0.5,

    // Left face
    -0.5, -2.0, -0.5,
    -0.5,  2.0,  0.5,
    -0.5, -2.0,  0.5,
    -0.5,  2.0, -0.5,
  ];

//  for(y=0;y<5;y++)

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obstacles), gl.STATIC_DRAW);
  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

var c;
var colors = [];
const faceColors2 = [
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
   [0.4,  1.0,  1.0,  1.0],  
//    [0.3,  0.2,  0.4,  1.0],
//    [0.7,  0.6,  1.0,  1.0],
  ];


  for (j = 1; j <= faceColors2.length; j+=1) {
      c = faceColors2[j-1];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }


/*
  // Convert the array of colors into a table for all the vertices.
  var c,color_flag=0;
  var colors = [];
  for(i=0; i<tunnel_length; i+=1)
  {
  	color_flag = color_flag+1;
  	if(color_flag>=30)
  	{
  		color_flag=0;
  		i--;
	}
  	else if(color_flag>=15)
  	{
  	//color_flag=0;
		for(j=0; j<faceColors.length; j+=1)
		{
	    	c = faceColors[j];
		    colors = colors.concat(c, c, c, c);
	    }
	}
	else
	{
		for(j=0; j<faceColors1.length; j+=1)
		{
	    	c = faceColors1[j];
		    colors = colors.concat(c, c, c, c);
	    }
	}
  }
*/
    // Repeat each color four times for the four vertices of the face
 

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

const indices = [
    3,  1,  2,      3,  2,  0,    // front
    4,  6,  5,      4,  5,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 18, 17,     16, 17, 19,   // right
    20, 22, 21,     20, 21, 23,   // left
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//
function drawScene1(gl, programInfo, buffers, deltaTime,ind) {
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  // gl.clearDepth(1.0);                 // Clear everything
  // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [0.0, 1.0, obstacle_Translation[ind]]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              obstacle_Rotation[ind],     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              0,// amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around (X)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  obstacle_Rotation[ind] = obstacle_Rotation[ind]+deltaTime;
  obstacle_Translation[ind] = obstacle_Translation[ind]+deltaTime*20;

    var angle;
  angle = obstacle_Rotation[ind]*180/3.1415;
  angle = angle%180;
        if(!game_over)
        {
          if(obstacle_Translation[ind]<0.5 && obstacle_Translation[ind]>-0.5)
          {
          if((angle>0 && angle<25)||(angle>155 && angle<180))
          {
            lives--;
            //console.log("collide"+i);
            //console.log(angle);
            if(lives==0)
            alert('Game over');
            //game_over = 1;
             
          }
          }
        }
}