var cubeRotation = 22.5;
var tunnel_length = 200;
var t_count = 0;
var myTranslation = 0.0;
var grayScala = 0;
var flash_flag = 0;

var jump_flag = 0;
var jump_y = 1;
var jump_speed = 0.2;
var jump_accel=0.005;
var score=0;
var lives=3;
var ctx;
main();

//
// Start here
//

Mousetrap.bind('a', function () {
   cubeRotation+=0.05;
   for(var c=0;c<3;c++)
   {
    obstacle_Rotation[c]+=0.05;
    obstacle2_Rotation[c]+=0.05;
   }
})

Mousetrap.bind('w', function () {
  if(jump_y==1.0)
    {
      if(jump_flag==0)
      {
      jump_speed=0.1;
      jump_flag=1;
      }
    }
})

Mousetrap.bind('g', function () {
  if(grayScala == 1)
    grayScala=0;
  else
    grayScala=1;
})

Mousetrap.bind('f', function () {
  if(flash_flag == 1)
    flash_flag=0;
  else
    flash_flag=1;
})

Mousetrap.bind('d', function () {
  cubeRotation-=0.05;
})


function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}


function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  var textCanvas = document.getElementById("text");
  ctx = textCanvas.getContext("2d");
  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource2 = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;
  
  // Fragment shader program

  const fsSource2 = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;


const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform bool flag;


    void main(void) 
    {
      if(flag)
      {
        vLighting = vec3(1.0,1.0,1.0);
      }
      else
      {  
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
        // Apply lighting effect
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        //highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
        highp vec3 directionalVector = normalize(vec3(0, -1.5, 10.0));
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);  
      }

    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;

    void main(void) 
    {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

const fsSourceGray = `
    #ifdef GL_ES
      precision mediump float;
    #endif
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      float gray = (texelColor.r * 0.299 + texelColor.g * 0.587 + texelColor.b * 0.144);
      vec3 grayscale = vec3(gray);


      
      gl_FragColor = vec4(gray * vLighting, texelColor.a);
    }
  `;

  const fsSourceFlash = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
   
    varying highp vec2 vTextureCoord;
   
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;

    uniform lowp float shadows;
    uniform lowp float highlights;

    const mediump vec3 luminanceWeighting = vec3(0.3, 0.3, 0.3);

    
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      mediump float luminance = dot(texelColor.rgb, luminanceWeighting);

      //(shadows+1.0) changed to just shadows:
      mediump float shadow = clamp((pow(luminance, 1.0/shadows) + (-0.76)*pow(luminance, 2.0/shadows)) - luminance, 0.0, 1.0);
      mediump float highlight = clamp((1.0 - (pow(1.0-luminance, 1.0/(2.0-highlights)) + (-0.8)*pow(1.0-luminance, 2.0/(2.0-highlights)))) - luminance, -1.0, 0.0);
      lowp vec3 result = vec3(0.0, 0.0, 0.0) + ((luminance + shadow + highlight) - 0.0) * ((texelColor.rgb - vec3(0.0, 0.0, 0.0))/(luminance - 0.0));

      // blend toward white if highlights is more than 1
      mediump float contrastedLuminance = ((luminance - 0.5) * 1.5) + 0.5;
      mediump float whiteInterp = contrastedLuminance*contrastedLuminance*contrastedLuminance;
      mediump float whiteTarget = clamp(highlights, 1.0, 2.0) - 1.0;
      result = mix(result, vec3(1.0), whiteInterp*whiteTarget);

      // blend toward black if shadows is less than 1
      mediump float invContrastedLuminance = 1.0 - contrastedLuminance;
      mediump float blackInterp = invContrastedLuminance*invContrastedLuminance*invContrastedLuminance;
      mediump float blackTarget = 1.0 - clamp(shadows, 0.0, 1.0);
      result = mix(result, vec3(0.0), blackInterp*blackTarget);


      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
      // gl_FragColor = vec4(result.rgb * vLighting, texelColor.a);
    }
  `;
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram4 = initShaderProgram(gl, vsSource, fsSourceFlash);
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const shaderProgram3 = initShaderProgram(gl, vsSource, fsSourceGray);
  const shaderProgram2 = initShaderProgram(gl, vsSource2, fsSource2);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
const programInfo4 = {
    program: shaderProgram4,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram4, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram4, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram4, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram4, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram4, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram4, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram4, 'uSampler'),
      flash_flag: gl.getUniformLocation(shaderProgram4, 'flag'),

    },
  };

  // look up uniform locations.
const programInfo3 = {
    program: shaderProgram3,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram3, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram3, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram3, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram3, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram3, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram3, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram3, 'uSampler'),

    },
  };


 const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      myflag: gl.getUniformLocation(shaderProgram3, 'myflag'),
    },
  };

 const programInfo2 = {
    program: shaderProgram2,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram2, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram2, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram2, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram2, 'uModelViewMatrix'),
    },
  };
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  const buffers1 = initBuffers1(gl);
  const buffers2 = initBuffers2(gl);

  const texture = loadTexture(gl, './index4.jpeg');
  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // if(jump_y>=0.95 && jump_speed<0)
    // {
    //   jump_flag=0;
    //   jump_speed=0;
    //   jump_accel=0;
    //   jump_y=1.0;
    // } 
    // //  jump_y<=1.05)
    // if(jump_flag==1)
    // {
    //   jump_speed=0.001;
    //   jump_accel=0.0001;
    // }
    //   jump_speed-=jump_accel;
    //   jump_y-=jump_speed

    if(jump_flag==1)
    {
      if(jump_y>1.0)
      {
        jump_speed=0;
        jump_flag=0;        
        jump_y=1.0;
      }
      else
      { 
        jump_y -= jump_speed;
        jump_speed -= jump_accel; 
       
      }
    }
    
    if(grayScala==1)
    drawScene(gl, programInfo3, buffers, texture, deltaTime);
    else
    {
      if(flash_flag==1)
        drawScene(gl, programInfo4, buffers, texture, deltaTime);
      else 
        drawScene(gl, programInfo, buffers, texture, deltaTime);

    }
    for(var y=0;y<3;y++)
	{
   drawScene1(gl, programInfo2, buffers1, deltaTime,y);
    drawScene2(gl, programInfo2, buffers2, deltaTime,y);
	}
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

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
    var g_vertex_buffer_data = [];
    var i,j,k,n=8,top=0;
    for(i=0;i<n;i++)
    {
        g_vertex_buffer_data[top++]=2*Math.cos((2*3.1416/n)*i);
        g_vertex_buffer_data[top++]=2*Math.sin((2*3.1416/n)*i);
        g_vertex_buffer_data[top++]=-2;

 		g_vertex_buffer_data[top++]=2*Math.cos((2*3.1416/n)*i);
        g_vertex_buffer_data[top++]=2*Math.sin((2*3.1416/n)*i);
        g_vertex_buffer_data[top++]=-6;

        g_vertex_buffer_data[top++]=2*Math.cos((2*3.1416/n)*(i+1));
        g_vertex_buffer_data[top++]=2*Math.sin((2*3.1416/n)*(i+1));
        g_vertex_buffer_data[top++]=-2;

        g_vertex_buffer_data[top++]=2*Math.cos((2*3.1416/n)*(i+1));
        g_vertex_buffer_data[top++]=2*Math.sin((2*3.1416/n)*(i+1));
        g_vertex_buffer_data[top++]=-6;
    }


  var l = g_vertex_buffer_data.length;
  for(i=1;i<=tunnel_length;i=i+1)
  {
  	for(j=0;j<l;j=j+3)
  	{
  		g_vertex_buffer_data.push(g_vertex_buffer_data[j]);
  		g_vertex_buffer_data.push(g_vertex_buffer_data[j+1]);
  		g_vertex_buffer_data.push(g_vertex_buffer_data[j+2]-4*i);
  	}
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_vertex_buffer_data), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.


  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  var vertexNormals = [
    // Face 1
    5.656850496748460, 2.343141997766190, 0,
    5.656850496748460, 2.343141997766190, 0,
    5.656850496748460, 2.343141997766190, 0,
    5.656850496748460, 2.343141997766190, 0,

    // Face 2
    2.343149503244498, 5.656847387874637, 0,
    2.343149503244498, 5.656847387874637, 0,
    2.343149503244498, 5.656847387874637, 0,
    2.343149503244498, 5.656847387874637, 0,

    // Face 3
    -2.343134492283756, 5.65685360561233, 0,
    -2.343134492283756, 5.65685360561233, 0,
    -2.343134492283756, 5.65685360561233, 0,
    -2.343134492283756, 5.65685360561233, 0,

    // Face 4
    -5.656844278990856, 2.34315700871868, 0,
    -5.656844278990856, 2.34315700871868, 0,
    -5.656844278990856, 2.34315700871868, 0,
    -5.656844278990856, 2.34315700871868, 0,

    // Face 5
    -5.65685671446623, -2.343126986797201, 0,
    -5.65685671446623, -2.343126986797201, 0,
    -5.65685671446623, -2.343126986797201, 0,
    -5.65685671446623, -2.343126986797201, 0,

    // Face 6
    -2.34316451418874, -5.656841170097116, 0,
    -2.34316451418874, -5.656841170097116, 0,
    -2.34316451418874, -5.656841170097116, 0,
    -2.34316451418874, -5.656841170097116, 0,

    // Face 7
    2.343119481306521, -5.656859823310183, 0,
    2.343119481306521, -5.656859823310183, 0,
    2.343119481306521, -5.656859823310183, 0,
    2.343119481306521, -5.656859823310183, 0,

    // Face 8
    5.656838061193419, -2.343172019654669, 0,
    5.656838061193419, -2.343172019654669, 0,
    5.656838061193419, -2.343172019654669, 0,
    5.656838061193419, -2.343172019654669, 0,
  ];

   var tt;
  // Now send the element array to GL
  for (j = 1; j <= tunnel_length; j+=1)
  {
    for (i = 1 ; i <= 96 ; i+=1)
    {
    	tt=vertexNormals[i-1];
        vertexNormals.push(tt);
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                gl.STATIC_DRAW);




 const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

     0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,

     0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

   var tt;
  // Now send the element array to GL
  for (j = 1; j <= tunnel_length; j+=1)
  {
  	tt=0;
    for (i = 1 ; i <= 64 ; i+=1)
    {
    	tt=textureCoordinates[i-1];
        textureCoordinates.push(tt);
    }
  } 

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);




  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,    1,  2,  3,    // front
    4,  5,  6,    5,  6,  7,    // back
    8,  9,  10,   9,  10, 11,   // top
    12, 13, 14,   13, 14, 15,   // bottom
    16, 17, 18,   17, 18, 19,   // right
    20, 21, 22,   21, 22, 23,   // left
    24, 25, 26,   25, 26, 27,   // left
    28, 29, 30,   29, 30, 31,   // left
  ];
  var tt;
  // Now send the element array to GL
  for (j = 1; j <= tunnel_length; j+=1)
  {
  	tt=0;  	
    for (i = 1 ; i <= 48 ; i+=1)
    {
    	tt=j*32+indices[i-1];
        indices.push(tt);
    }
  }  

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  // return {
  //   position: positionBuffer,
  //   color: colorBuffer,
  //   indices: indexBuffer,
  // };


  // return {
  //   position: positionBuffer,
  //   textureCoord: textureCoordBuffer,
  //   indices: indexBuffer,


  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


function drawScene(gl, programInfo, buffers,texture, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  score+=3;

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
                 [-0.0, jump_y, myTranslation]);  // amount to translate... final jump_y=1
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotation,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              0,// amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around (X)

const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);


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

// Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  // {
  //   const numComponents = 4;
  //   const type = gl.FLOAT;
  //   const normalize = false;
  //   const stride = 0;
  //   const offset = 0;
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  //   gl.vertexAttribPointer(
  //       programInfo.attribLocations.vertexColor,
  //       numComponents,
  //       type,
  //       normalize,
  //       stride,
  //       offset);
  //   gl.enableVertexAttribArray(
  //       programInfo.attribLocations.vertexColor);
  // }

 {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
}

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);
  for(var my =0;my<1000;my++)
  {
    gl.uniform1i(programInfo.uniformLocations.flash_flag, my%2);
  }

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

 gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);

   gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0   


gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 48*tunnel_length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw
const canvas = document.querySelector('#glcanvas');
  var textCanvas = document.getElementById("text");
  ctx = textCanvas.getContext("2d");
ctx.font = "20px Times New Roman";
  ctx.fillStyle = "#ff9900";
  ctx.fillText("Score: "+score, 20, 50);
  ctx.fillText("Lives: "+lives, 140, 50);

  myTranslation = myTranslation+deltaTime*20;
  if(myTranslation>=400)
  	{
  		myTranslation=0.0;
  		var y,temp=-100.0;;
		for(y=0;y<3;y=y+1)
		{
		  obstacle_Translation[y]=temp;
		  temp-=200.0;
		  obstacle_Rotation[y]=0.0;
		}
		temp=-200.0;
		for(y=0;y<3;y=y+1)
		{
		  obstacle2_Translation[y]=temp;
		  temp-=200.0;
		  obstacle2_Rotation[y]=0.0;
		}
	}
	
}
//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

