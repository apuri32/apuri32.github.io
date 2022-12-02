//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

/* // Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_modelMatrix;\n' +
  //'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_modelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
   */


var worldBox = new VBObox0();  // Ground Grid
var partBox1 = new VBObox1();  // no lighting -> works
var partBox2 = new VBObox2();   //gorand
var partBox3 = new VBObox3(); //phong


var g_show00 = true;
var g_show1 = false; 
var g_show2 = true;
var g_show3 = false;


var floatsPerVertex = 12;	// # of Float32Array elements used for each vertex	// (x,y,z)position + (r,g,b)color

var currentAngle = 0.0;
var ANGLE_STEP = 45.0;

var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;                  // initial rotation angle
var g_angle02Rate = 40.0; 

var g_translate = 0;
var g_translateRate = 5;

var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
var sq2	= Math.sqrt(2.0);

// Mouse click and drag
var isDrag=false;
var xMclik=0.0;
var yMclik=0.0;   
var xMdragTot=0.0;
var yMdragTot=0.0; 

// View & Projection
var eyeX = 0.0;
var eyeY = 5.0;
var eyeZ = 1.0;
var atX = 0.0;
var atY = 0.0;
var atZ = 0.0;
var theta = 0.0;  // turn camera horizontally to angle theta
var r = eyeY-atY;  // radius of camera cylinder
var tilt = 0.0;


/* var fLeft = -2.0;  // frustum para
var fRight = 2.0;
var fBottom = -2.0;
var fTop = 2.0;
var fNear = 3.0;
var fFar = 100.0; 
var frustum = false; */

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  worldBox.init(gl);
  partBox1.init(gl);
  partBox2.init(gl);
  partBox3.init(gl);
  //partBox4.init(gl);
  //partBox5.init(gl);

  /* // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  } */

  
  // Register the event handler to be called on key press
  document.onkeydown= function(ev){keydown(ev, gl); };
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
   
	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  /* var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  } */

  // Specify the color for clearing <canvas>
  gl.clearColor(0.25, 0.2, 0.25, 1.0);

  normalMatrix = new Matrix4();
  vpMatrix = new Matrix4();
  mvpMatrix = new Matrix4();

/*   qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
  qTot = new Quaternion(0,0,0,1);
  quatMatrix = new Matrix4();  // rotation matrix */
 

  /*  // Get the graphics system storage locations of
  // the uniform variables u_modelMatrix.
  u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
  gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);  // 2nd para is Transpose. Must be false in WebGL.
 
  //var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix'); 
  if (!u_modelMatrix) { 
    console.log('Failed to get u_modelmatrix');
    return;
  }*/





  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    // console.log(currentAngle);
    drawResize();
    requestAnimationFrame(tick, canvas);   
  };
  tick();	


  // old random code just in case
 /* // Create a JavaScript matrix to specify the view transformation
  var viewMatrix = new Matrix4();
  // Register the event handler to be called on key press
 document.onkeydown= function(ev){keydown(ev, gl, u_ViewMatrix, viewMatrix); };
	// (Note that I eliminated the 'n' argument (no longer needed)).
	
  // Create the matrix to specify the camera frustum, 
  // and pass it to the u_ProjMatrix uniform in the graphics system
  var projMatrix = new Matrix4();
  // REPLACE this orthographic camera matrix:
/*  projMatrix.setOrtho(-1.0, 1.0, 					// left,right;
  										-1.0, 1.0, 					// bottom, top;
  										0.0, 2000.0);				// near, far; (always >=0)

	// with this perspective-camera matrix:
	// (SEE PerspectiveView.js, Chapter 7 of book)

  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

  // YOU TRY IT: make an equivalent camera using matrix-cuon-mod.js
  // perspective-camera matrix made by 'frustum()' function..
  
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  //draw(gl, u_ViewMatrix, viewMatrix);   // Draw the triangles */

  //drawResize(gl, canvas.width, u_ProjMatrix, u_ViewMatrix);
}
function makeCylinder() {
  //==============================================================================
  // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
  // 'stepped spiral' design described in notes.
  // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
  //
   var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
   var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
   var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
   var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
   var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
   
   // Create a (global) array to hold this cylinder's vertices;
   cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
                      // # of vertices * # of elements needed to store them. 
  
    // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
    // v counts vertices: j counts array elements (vertices * elements per vertex)
    for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
      // skip the first vertex--not needed.
      if(v%2==0)
      {				// put even# vertices at center of cylinder's top cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] = 1.0; 
        cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
        cylVerts[j+4]=ctrColr[0]; 
        cylVerts[j+5]=ctrColr[1]; 
        cylVerts[j+6]=ctrColr[2];
      }
      else { 	// put odd# vertices around the top cap's outer edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
        cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
        //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
        //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
        cylVerts[j+2] = 1.0;	// z
        cylVerts[j+3] = 1.0;	// w.
        // r,g,b = topColr[]
        cylVerts[j+4]=topColr[0]; 
        cylVerts[j+5]=topColr[1]; 
        cylVerts[j+6]=topColr[2];			
      }
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
      if(v%2==0)	// position all even# vertices along top cap:
      {		
          cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
          cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
          cylVerts[j+2] = 1.0;	// z
          cylVerts[j+3] = 1.0;	// w.
          // r,g,b = topColr[]
          cylVerts[j+4]=topColr[0]; 
          cylVerts[j+5]=topColr[1]; 
          cylVerts[j+6]=topColr[2];			
      }
      else		// position all odd# vertices along the bottom cap:
      {
          cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
          cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
          cylVerts[j+2] =-1.0;	// z
          cylVerts[j+3] = 1.0;	// w.
          // r,g,b = topColr[]
          cylVerts[j+4]=botColr[0]; 
          cylVerts[j+5]=botColr[1]; 
          cylVerts[j+6]=botColr[2];			
      }
    }
    // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements
    for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
      if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
        cylVerts[j+2] =-1.0;	// z
        cylVerts[j+3] = 1.0;	// w.
        // r,g,b = topColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];		
      }
      else {				// position odd#'d vertices at center of the bottom cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] =-1.0; 
        cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];
      }
    }
  }
  
  function makeSphere() {
    var slices =12;		
    var sliceVerts	= 21;

    var topColr = new Float32Array([1.0, 0.0, 1.0]);
    var equColr = new Float32Array([1.0, 0.0, 1.0]);
    var botColr = new Float32Array([1.0, 0.0, 1.0]);
    var sliceAngle = Math.PI/slices;	

    sphVerts1 = new Float32Array(((slices*2*sliceVerts)-2) * floatsPerVertex);
                                
    var cos0 = 0.0;				
    var sin0 = 0.0;				
    var cos1 = 0.0;			
    var sin1 = 0.0;
    var j = 0;					
    var isLast = 0;
    var isFirst = 1;	
    for(s=0; s<slices; s++) {	
        if(s==0) {
            isFirst = 1;		
            cos0 =  0.0; 		
            sin0 = -1.0;		
        }
        else {					
            isFirst = 0;	
            cos0 = cos1;
            sin0 = sin1;
        }						
        cos1 = Math.cos((-Math.PI/2) +(s+1)*sliceAngle); 
        sin1 = Math.sin((-Math.PI/2) +(s+1)*sliceAngle);
        if(s==slices-1) isLast=1;
        for(v=isFirst;    v< 2*sliceVerts-isLast;   v++,j+=floatsPerVertex)
        {					
            if(v%2 ==0) { 
                sphVerts1[j  ] = cos0 * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+1] = cos0 * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+2] = sin0;																			// z
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cos0 * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+8] = cos0 * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+9] = sin0;																			// w.				
            }
            else {	
                sphVerts1[j  ] = cos1 * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+1] = cos1 * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+2] = sin1;		
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cos1 * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+8] = cos1 * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+9] = sin1;
            }
            if(v==0) { 	
                sphVerts1[j+4]=equColr[0]; 
                sphVerts1[j+5]=equColr[1]; 
                sphVerts1[j+6]=equColr[2];				
                }
            else if(isFirst==1) {	
                sphVerts1[j+4]=botColr[0]; 
                sphVerts1[j+5]=botColr[1]; 
                sphVerts1[j+6]=botColr[2];	
                }
            else if(isLast==1) {
                sphVerts1[j+4]=topColr[0]; 
                sphVerts1[j+5]=topColr[1]; 
                sphVerts1[j+6]=topColr[2];	
            }
            else {	
                sphVerts1[j+4]= 1.0; 
                sphVerts1[j+5]= 0.0;	
                sphVerts1[j+6]= 1.0;	
            }
            sphVerts1[j+10] = 0.0;  // Texture Coord
            sphVerts1[j+11] = 0.0;
        }
    }
} 
  
function makeTorus() {
  //==============================================================================
  // 		Create a torus centered at the origin that circles the z axis.  
  // Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
  // into a circle around the z-axis. The bent bar's centerline forms a circle
  // entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
  // bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
  // around the z-axis in counter-clockwise (CCW) direction, consistent with our
  // right-handed coordinate system.
  // 		This bent bar forms a torus because the bar itself has a circular cross-
  // section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
  // around the bar's centerline, circling right-handed along the direction 
  // forward from the bar's start at theta=0 towards its end at theta=2PI.
  // 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
  // a slight increase in phi moves that point in -z direction and a slight
  // increase in theta moves that point in the +y direction.  
  // To construct the torus, begin with the circle at the start of the bar:
  //					xc = rbend + rbar*cos(phi); 
  //					yc = 0; 
  //					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
  // and then rotate this circle around the z-axis by angle theta:
  //					x = xc*cos(theta) - yc*sin(theta) 	
  //					y = xc*sin(theta) + yc*cos(theta)
  //					z = zc
  // Simplify: yc==0, so
  //					x = (rbend + rbar*cos(phi))*cos(theta)
  //					y = (rbend + rbar*cos(phi))*sin(theta) 
  //					z = -rbar*sin(phi)
  // To construct a torus from a single triangle-strip, make a 'stepped spiral' 
  // along the length of the bent bar; successive rings of constant-theta, using 
  // the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
  // makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
  // for the first and last of these bar-encircling rings.
  //
  var rbend = 1.0;										// Radius of circle formed by torus' bent bar
  var rbar = 0.5;											// radius of the bar we bent to form torus
  var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
                                      // more segments for more-circular torus
  var barSides = 13;										// # of sides of the bar (and thus the 
                                      // number of vertices in its cross-section)
                                      // >=3 req'd;
                                      // more sides for more-circular cross-section
  // for nice-looking torus with approx square facets, 
  //			--choose odd or prime#  for barSides, and
  //			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
  // EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.
  
    // Create a (global) array to hold this torus's vertices:
   torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
  //	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
  // triangle and last slice will skip its last triangle. To 'close' the torus,
  // repeat the first 2 vertices at the end of the triangle-strip.  Assume 7
  
  var phi=0, theta=0;										// begin torus at angles 0,0
  var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
  var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
                                        // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
      for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
        if(v%2==0)	{	// even #'d vertices at bottom of slice,
          torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
                                               Math.cos((s)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
                                               Math.sin((s)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        else {				// odd #'d vertices at top of slice (s+1);
                      // at same phi used at bottom of slice (v-1)
          torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
                                               Math.cos((s+1)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
                                               Math.sin((s+1)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
      }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
        torVerts[j  ] = rbend + rbar;	// copy vertex zero;
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
        torVerts[j+1] = 0.0;
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;		// w
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
        j+=7; // go to next vertex:
        torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
        torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;		// w
        torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
  }

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(7*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= 7) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= 7) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}

function makeAxis(){
  axisVerts = new Float32Array([
      0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// X axis line (origin: gray)
      3.3,  0.0,  0.0, 1.0,		1.0,  0.3,  0.3,	// 						 (endpoint: red)
   
      0.0,  0.0,  0.0, 1.0,       0.3,  0.3,  0.3,	// Y axis line (origin: white)
      0.0,  3.3,  0.0, 1.0,		0.3,  1.0,  0.3,	//						 (endpoint: green)

      0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// Z axis line (origin:white)
      0.0,  0.0,  3.3, 1.0,		0.3,  0.3,  1.0,	//						 (endpoint: blue)
  ]);
}

function makeFish(){
    fishVerts = new Float32Array([
        	// Face 0: (left side)  
     0.0,  0.0, sq2, 1.0,		  1.0, 1.0,	1.0,	    0.0, 1.0, 0.0,    0.0, 0.0,// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 2
		// Face 1: (right side)
	  0.0,  0.0, sq2, 1.0,		  1.0, 1.0,	1.0,	    0.0, 1.0, 0.0,    0.0, 0.0,// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0, 0.0,	    0.0, 1.0, 0.0,    0.0, 0.0,// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0, 0.0, 	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 3
    	// Face 2: (lower side)
	    0.0,  0.0, sq2, 1.0,		1.0,  1.0,	1.0,    0.0, 1.0, 0.0,    0.0, 0.0,// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0,    0.0, 1.0, 0.0,    0.0, 0.0,// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0,	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 2
     c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	  0.0, 1.0, 0.0,    0.0, 0.0,// Node 1


     	// +x face: RED
		0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
		0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
		1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,  // Node 4
		
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
		0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
		1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3

		0.5,  0.5,  0.5, 1.0,     1.0, 0.0, 0.0,
		0.5,  0.5, -0.5, 1.0, 	  0.0, 1.0, 1.0,
		1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,

		0.5, -0.5,  0.5, 1.0,     1.0, 0.0, 1.0,
		0.5, -0.5, -0.5, 1.0, 	  1.0, 1.0, 0.0,
		1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,
   
		   // +y face: GREEN
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
	   	0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
   
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
		0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2 
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
   
		   // +z face: BLUE
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
	    0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
   
		0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
		0.5,  0.5,  0.5, 1.0,	  1.0, 0.0, 0.0,	// Node 4
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5
   
		   // -x face: CYAN
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6	
	   -0.5,  0.5,  0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 5 
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,	// Node 1
	   
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0  
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,	// Node 6
	   
	   -0.5,  0.5,  0.5, 1.0,     1.0, 1.0, 0.0,
	   -0.5,  0.5, -0.5, 1.0, 	  0.0, 1.0, 1.0,
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,

	   -0.5, -0.5,  0.5, 1.0,     0.0, 0.0, 1.0,
	   -0.5, -0.5, -0.5, 1.0, 	  1.0, 0.0, 1.0,
	   -1.0,  0.0,  0.0, 1.0,	  1.0, 1.0, 1.0,  
	   
		   // -y face: MAGENTA
		0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
		0.5, -0.5,  0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 7
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
   
	   -0.5, -0.5,  0.5, 1.0,	  0.0, 0.0, 1.0,	// Node 6
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0
	    0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
   
		// -z face: YELLOW
		0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
		0.5, -0.5, -0.5, 1.0,	  1.0, 1.0, 0.0,	// Node 3
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0		
   
	   -0.5, -0.5, -0.5, 1.0,	  1.0, 0.0, 1.0,	// Node 0
	   -0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 1
	    0.5,  0.5, -0.5, 1.0,	  0.0, 1.0, 1.0,	// Node 2
    ]);
}

function makeCube(){
  var faceVerts = 4;
  cubeVerts = new Float32Array((2*faceVerts+1)*6*floatsPerVertex);

  upColor = new Float32Array([0.1, 0.3, 0.1]);

  unitLen = Math.sqrt(2);
  // up face
  for (v = 0,j = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/4 + Math.PI/4);
          cubeVerts[j+1] = unitLen/2;
          cubeVerts[j+2] = -Math.sin(Math.PI*v/4 + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = upColor[0];
          cubeVerts[j+5] = upColor[1];
          cubeVerts[j+6] = upColor[2];
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 1.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = unitLen/2;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = upColor[0];
          cubeVerts[j+5] = upColor[1];
          cubeVerts[j+6] = upColor[2];
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 1.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // bottom face
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = -unitLen/2;
          cubeVerts[j+2] = -Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.2;
          cubeVerts[j+6] = 0.0;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = -1.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = -unitLen/2;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.2;
          cubeVerts[j+6] = 0.0;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = -1.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // back
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = unitLen/2;
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.6;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.6;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 1.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = unitLen/2;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.6;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.6;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 1.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
  // front
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -unitLen/2;
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.8;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.8;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = -1.0;
      } else {  // central vertices
          cubeVerts[j] = 0.0;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = -unitLen/2;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.8;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.8;
          cubeVerts[j+7] = 0.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = -1.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }

  // right
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = unitLen/2;
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 1.0;
          cubeVerts[j+7] = 1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = unitLen/2;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 1.0;
          cubeVerts[j+7] = 1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
  // left
  for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
      if (v%2 == 0){  
          cubeVerts[j] = -unitLen/2;
          cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
          cubeVerts[j+3] = 1.0;
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.5;
          cubeVerts[j+7] = -1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      } else {  // central vertices
          cubeVerts[j] = -unitLen/2;
          cubeVerts[j+1] = 0.0;
          cubeVerts[j+2] = 0.0;
          cubeVerts[j+3] = 1.0; 
          cubeVerts[j+4] = 0.0;
          cubeVerts[j+5] = 0.0;
          cubeVerts[j+6] = 0.5;
          cubeVerts[j+7] = -1.0;
          cubeVerts[j+8] = 0.0;
          cubeVerts[j+9] = 0.0;
      }
      cubeVerts[j+10] = 0.0;  // Texture Coord
      cubeVerts[j+11] = 0.0;
  }
}

function makePyramid() {
  botVert = 4;  // number of vertices on the bottom
  pyrVerts = new Float32Array((4*botVert+3)*floatsPerVertex);

  // bottom
  for (v = 0, j = 0; v < 2*botVert+2; v++, j += floatsPerVertex){
      if (v%2 == 0){
          pyrVerts[j] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.3;
          pyrVerts[j+6] = 0.3;
      }else{
          pyrVerts[j] = 0.0;
          pyrVerts[j+1] = 0.0;
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.3;
          pyrVerts[j+6] = 0.3;           
      }
      pyrVerts[j+7] = 0.0;
      pyrVerts[j+8] = 0.0;
      pyrVerts[j+9] = 1.0;
      pyrVerts[j+10] = 0.0;  // Texture Coord
      pyrVerts[j+11] = 0.0;
  }

  // wall
  for (v = 0; v < 2*botVert+1; v++, j+=floatsPerVertex){
      if (v%2 == 0){
          pyrVerts[j] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+2] = 0.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.5;
          pyrVerts[j+6] = 0.3;
          pyrVerts[j+7] = Math.cos(Math.PI*v/botVert);
          pyrVerts[j+8] = Math.sin(Math.PI*v/botVert);
          pyrVerts[j+9] = 1.0;
          pyrVerts[j+10] = Math.abs(Math.sin(Math.PI*v/4));  // Texture Coord
          pyrVerts[j+11] = 0.0;
      } else{
          pyrVerts[j] = 0.0;
          pyrVerts[j+1] = 0.0;
          pyrVerts[j+2] = 1.0;
          pyrVerts[j+3] = 1.0;
          pyrVerts[j+4] = 0.3;
          pyrVerts[j+5] = 0.7;
          pyrVerts[j+6] = 0.3;
          pyrVerts[j+7] = Math.cos(Math.PI*(v-1)/botVert);
          pyrVerts[j+8] = Math.sin(Math.PI*(v-1)/botVert);
          pyrVerts[j+9] = 1.0;
          pyrVerts[j+10] = 1.0;  // Texture Coord
          pyrVerts[j+11] = 1.0;
      }
  }
}

/* function initVertexBuffers(gl) {
//==============================================================================

	/* // make our 'forest' of triangular-shaped trees:
  forestVerts = new Float32Array([
    // 3 Vertex coordinates (x,y,z) and 3 colors (r,g,b)
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
  ]); 
  
  // Make our 'ground plane'; can you make a'torus' shape too?
  // (recall the 'basic shapes' starter code...)
  //makeCylinder();					// create, fill the cylVerts array
  makeSphere();						// create, fill the sphVerts array
  //makeTorus();
  //makeFish();
  makeGroundGrid();
  makeAxis();

	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
	mySiz = /* cylVerts.length +  sphVerts.length /* + 
  torVerts.length  + fishVerts.length  + gndVerts.length + axisVerts.length;

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	/* forestStart = 0;							// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
		}  
    
		sphStart = 0;						// next, we'll store the sphere;
	for(i = 0,j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		verticesColors[i] = sphVerts[j];
		}
    /* cylStart = i;
  for(j=0; j<cylVerts.length; i++,j++) {
    verticesColors[i] = cylVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		verticesColors[i] = torVerts[j];
		}
        fishStart = i;
    for(j=0; j< fishVerts.length; i++, j++) {
		verticesColors[i] = fishVerts[j];
		} 
	gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		verticesColors[i] = gndVerts[j];
		}
  axisStart = i;
  for(j=0; j< axisVerts.length; i++, j++) {
		verticesColors[i] = axisVerts[j];
    }

  
  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 4);
  gl.enableVertexAttribArray(a_Color);

  return nn;	// return # of vertices
} */

//var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; 
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;    
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;


  g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
  if(g_angle01 <-180.0) g_angle01 = g_angle01 + 360.0;

  g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  if(g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
  if(g_angle02 <-180.0) g_angle02 = g_angle02 + 360.0;

  if(g_angle02 > 15.0 && g_angle02Rate > 0) g_angle02Rate *= -1.0;
  if(g_angle02 < 0.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;

  g_translate = g_translate + (g_translateRate * elapsed) / 1000.0;
  if(g_translate > 5) g_translateRate = -5;
  if(g_translate <-5) g_translateRate = 5;


  return newAngle %= 360;
}


function keydown(ev) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

switch(ev.code){
    case "ArrowLeft": //cam left
        eyeX += 0.1 * Math.cos(theta*Math.PI/180);
        eyeY += 0.1 * Math.sin(theta*Math.PI/180);
        atX += 0.1 * Math.cos(theta*Math.PI/180);
        atY += 0.1 * Math.sin(theta*Math.PI/180);
        break;
    case "ArrowRight": // cam right
        eyeX -= 0.1 * Math.cos(theta*Math.PI/180);
        eyeY -= 0.1 * Math.sin(theta*Math.PI/180);
        atX -= 0.1 * Math.cos(theta*Math.PI/180);
        atY -= 0.1 * Math.sin(theta*Math.PI/180);
        break;
    case "ArrowUp":
        atZ += 0.1;
        eyeZ += 0.1;
        break;
    case "ArrowDown":
        atZ -= 0.1;
        eyeZ -= 0.1;
        break;

    case "KeyW":
        atZ += 0.1;
        break;
    case "KeyS":
        atZ -= 0.1;
        break;
    case "KeyA":
        theta += 2;
        atX = eyeX + r*Math.sin(theta*Math.PI/180);
        atY = eyeY - r*Math.cos(theta*Math.PI/180);
        break;
    case "KeyD":
        theta -= 2;
        atX = eyeX + r*Math.sin(theta*Math.PI/180);
        atY = eyeY - r*Math.cos(theta*Math.PI/180);
        break;
    case "Equal":
        eyeX += 0.1*Math.sin(theta*Math.PI/180);
        atX += 0.1*Math.sin(theta*Math.PI/180);
        eyeY -= 0.1*Math.cos(theta*Math.PI/180);
        atY -= 0.1*Math.cos(theta*Math.PI/180);
        var tan = (atZ - eyeZ)/(atY - eyeY);
        eyeZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        atZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        break;
    case "Minus":
        eyeX -= 0.1*Math.sin(theta*Math.PI/180);
        atX -= 0.1*Math.sin(theta*Math.PI/180);
        eyeY += 0.1*Math.cos(theta*Math.PI/180);
        atY += 0.1*Math.cos(theta*Math.PI/180);
        var tan = (atZ - eyeZ)/(atY - eyeY);
        eyeZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        atZ += 0.1*Math.cos(theta*Math.PI/180)*tan;
        break;

    case "KeyB":
      console.log('click!');
        isBlinn = -isBlinn;
        break;
    case "KeyV":
      if(g_show1){
        g_show1 = false;
        g_show2 = true;
        g_show3 = false;
      }
      else if(g_show2){
        g_show1 = false;
        g_show2 = false;
        g_show3 = true;
      }
      else if(g_show3){
        g_show1 = true;
        g_show2 = false;
        g_show3 = false;
      }
      break;
      case "Digit1":
        if (lamp0On == 0){
          lamp0On = 1;
        } else {
          lamp0On = 0;
        }
        break;
      case "Digit2":
        if (lamp1On == 0){
          lamp1On = 1;
        } else {
          lamp1On = 0;
        }
        break;
      case "Digit3":
        if (lamp2On == 0){
          lamp2On = 1;
        } else {
          lamp2On = 0;
        }
        break;
      case "KeyL":
          if(whichAttFunc == 0){
            whichAttFunc = 1;
          }
          else if(whichAttFunc == 1){
            whichAttFunc = 2;
          }
          else if(whichAttFunc == 2){
            whichAttFunc = 0;
          }
          break;
      case "Digit0":
        matlSel0 = (matlSel0 +1)%MATL_DEFAULT;
        matl0.setMatl(matlSel0);
        break;
      




}


    /* if(ev.keyCode == 39) { // The right arrow key was pressed
//      g_EyeX += 0.01;
				eyeX += 0.5;		// INCREASED for perspective camera)
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
//      g_EyeX -= 0.01;
				eyeX -= 0.5;		// INCREASED for perspective camera)
    } else
    if (ev.keyCode == 38) {
        eyeZ += 0.5;
    } else
    if (ev.keyCode == 40) {
        eyeZ -= 0.5;
    
    } else { return; } // Prevent the unnecessary drawing */
    //draw(gl, u_ModelMatrix, modelMatrix);    
}
function myMouseDown(ev, gl, canvas) {
 //==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y; 
};


function myMouseMove(ev, gl, canvas) {
 //==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);

//move the lamp!!
  lamp0.I_pos.elements.set([
    lamp0.I_pos.elements[0] - (x - xMclik)*50,
    lamp0.I_pos.elements[1],
    lamp0.I_pos.elements[2] + (y - yMclik)*50]);
	
	xMclik = x;													// Make NEXT drag-measurement from here.
	yMclik = y;
	
	/* // Show it on our webpage, in the <div> element named 'MouseText':
	document.getElementById('MouseText').innerHTML=
			'Mouse Drag totals (CVV x,y coords):\t'+
			 xMdragTot.toFixed(5)+', \t'+
			 yMdragTot.toFixed(5); */	 
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

	// AND use any mouse-dragging we found to update quaternions qNew and qTot;
	

	// Show it on our webpage, in the <div> element named 'MouseText':
	/* document.getElementById('MouseText').innerHTML=
			'Mouse Drag totals (CVV x,y coords):\t'+
			 xMdragTot.toFixed(5)+', \t'+
			 yMdragTot.toFixed(5); */	
};

function dragQuat(xdrag, ydrag) {
/*//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
// We find a rotation axis perpendicular to the drag direction, and convert the 
// drag distance to an angular rotation amount, and use both to set the value of 
// the quaternion qNew.  We then combine this new rotation with the current 
// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
// 'draw()' function converts this current 'qTot' quaternion to a rotation 
// matrix for drawing. 
	var res = 5;
	var qTmp = new Quaternion(0,0,0,1);
	
	var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
	// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
	qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
	// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
							// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
							// -- to rotate around +x axis, drag mouse in -y direction.
							// -- to rotate around +y axis, drag mouse in +x direction.
							
	qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
	//--------------------------
	// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
	// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
	// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
	// first by qTot, and then by qNew--we would apply mouse-dragging rotations
	// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
	// rotations FIRST, before we apply rotations from all the previous dragging.
	//------------------------
	// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
	// them with finite precision. While the product of two (EXACTLY) unit-length
	// quaternions will always be another unit-length quaternion, the qTmp length
	// may drift away from 1.0 if we repeat this quaternion multiply many times.
	// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
	// Matrix4.prototype.setFromQuat().
//	qTmp.normalize();						// normalize to ensure we stay at length==1.0.
	qTot.copy(qTmp);
	// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
	/* document.getElementById('QuatValue').innerHTML= 
														 '\t X=' +qTot.x.toFixed(res)+
														'i\t Y=' +qTot.y.toFixed(res)+
														'j\t Z=' +qTot.z.toFixed(res)+
														'k\t W=' +qTot.w.toFixed(res)+
														'<br>length='+qTot.length().toFixed(res);
 */};

function draw(gl) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Using OpenGL/ WebGL 'viewports':
  // these determine the mapping of CVV to the 'drawing context',
	// (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
	// Details? see
	//
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the FIRST of several 'viewports'
  //------------------------------------------
	// CHANGE from our default viewport:
	// gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	// to a smaller one:
	// Viewport left side
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); 
  /* if (frustum){
      modelMatrix.setFrustum(fLeft,fRight,fBottom,fTop,fNear,fFar);
  } else{ */
      ratio = gl.drawingBufferWidth/gl.drawingBufferHeight;
      vpMatrix.setPerspective(35, ratio, 1, 100);
  //}
  vpMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, 0.0,0.0,1.0);  
  //pushMatrix(modelMatrix);

  // Pass the view projection matrix
  //gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);

	// Draw the scene:
	if (g_show00){  // Ground Grid
    worldBox.switchToMe();  
    worldBox.adjust();
    worldBox.draw();
  }
   if (g_show1){  // without light
    partBox1.switchToMe();  
    partBox1.adjust();
    partBox1.draw();
  } 
  if (g_show2){  // Gouroud
    partBox2.switchToMe();  
    partBox2.adjust();
    partBox2.draw();
}
    if (g_show3){  // Phong
    partBox3.switchToMe();  
    partBox3.adjust();
    partBox3.draw();
  }

 
   /*  // Draw in the SECOND of several 'viewports'
  //------------------------------------------
	gl.viewport(gl.drawingBufferWidth, 
              0, 
              gl.drawingBufferWidth/3, 
              gl.drawingBufferHeight); 
  modelMatrix.setOrtho(-Math.tan(20/180*Math.PI)*15/ratio, Math.tan(20/180*Math.PI)*15/ratio, -Math.tan(20/180*Math.PI)*15, Math.tan(20/180*Math.PI)*15, 1.0, 100.0);  // left, right, bottom, top, near, far
  modelMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, 0.0,0.0,1.0);  
    //pushMatrix(modelMatrix);							// up vector

  // Pass the view projection matrix to our shaders:
  //gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);

	// Draw the scene:
	drawMyScene(gl, u_modelMatrix, modelMatrix);
    
  /*       // Draw in the THIRD of several 'viewports'
  //------------------------------------------
	gl.viewport(0										, 				// Viewport lower-left corner
							gl.drawingBufferHeight/2, 		// location(in pixels)
  						gl.drawingBufferWidth/2, 				// viewport width, height.
  						gl.drawingBufferHeight/2);

	// but use a different 'view' matrix:
  viewMatrix.setLookAt(g_EyeY, g_EyeX, g_EyeZ, 	// eye position,
  											0, 0, 0, 								// look-at point,
  											0, 1, 0);								// 'up' vector.

  // Pass the view projection matrix to our shaders:
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  
	// Draw the scene:
	drawMyScene(gl, u_ViewMatrix, viewMatrix); */ 
}

function drawMyScene(myGL, myu_ModelMatrix, myModelMatrix, u_MvpMatrix, u_NormalMatrix) {
/* //===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

	// DON'T clear <canvas> or you'll WIPE OUT what you drew 
	// in all previous viewports!
	// myGL.clear(gl.COLOR_BUFFER_BIT);  						
  
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
  myGL.drawArrays(myGL.TRIANGLES, 				// use this drawing primitive, and
  						  forestStart/floatsPerVertex,	// start at this vertex number, and
  						  forestVerts.length/floatsPerVertex);	// draw this many vertices.
  
 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  myViewMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",
  																		// made by rotating -90 deg on +x-axis.
  																		// Move those new drawing axes to the 
  																		// bottom of the trees:
	myViewMatrix.translate(0.0, 0.0, -0.6);	
	myViewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes 
																			//for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices */

  /* pushMatrix(myModelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
    myModelMatrix.translate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    myModelMatrix.scale(0.2, 0.2, 0.2);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
    myModelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
  	// Drawing:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
    myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //=========================================================== 

  pushMatrix(myModelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
    myModelMatrix.translate(0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    myModelMatrix.scale(0.2, 0.2, 0.2);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
    myModelMatrix.rotate(-currentAngle, 0, 1, 1);  // spin around y axis.
  	// Drawing:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
    myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================*/
  //  
  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
    //--------Draw Spinning Sphere
    myModelMatrix.translate( 0.4, -0.4, 0.0); // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV.
                          // to match WebGL display canvas.
    myModelMatrix.scale(0.3, 0.3, 0.3);
    						// Make it smaller:
    myModelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    		// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
    							sphVerts.length/floatsPerVertex);	// draw this many vertices.
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  
  //===========================================================
  //  
  /* pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  //--------Draw Spinning torus
    myModelMatrix.translate(-0.4, 0.4, 0.0);	// 'set' means DISCARD old matrix,
  
    myModelMatrix.scale(0.3, 0.3, 0.3);
    						// Make it smaller:
    myModelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
    /* quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion Drag
	myModelMatrix.concat(quatMatrix); 
    //pushMatrix(modelMatrix);
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    		// Draw just the torus's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
    						  torStart/floatsPerVertex,	// start at this vertex number, and
    						  torVerts.length/floatsPerVertex);	// draw this many vertices.
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //myModelMatrix = popMatrix();
  //===========================================================
  // 

  pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  drawFish(myModelMatrix, myu_ModelMatrix);
  myModelMatrix = popMatrix();*/

  /* pushMatrix(myModelMatrix);  // SAVE world drawing coords.
  	//---------Draw Ground Plane, without spinning.
  	// position it.

    
  	myModelMatrix.translate( 0.4, -0.4, 0.0);	

    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements); // draw axis
    gl.drawArrays(gl.LINES, axisStart/floatsPerVertex, axisVerts.length/floatsPerVertex);
     
    
    myModelMatrix.scale(0.1, 0.1, 0.1);	// shrink by 10X:
  	// Drawing:
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
    // Draw just the ground-plane's vertices
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    			  gndStart/floatsPerVertex,	// start at this vertex number, and
    			  gndVerts.length/floatsPerVertex);	// draw this many vertices.
    
  myModelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
   *///===========================================================


}
function drawSphere(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
  modelMatrix.scale(0.5,0.5,0.5);
  modelMatrix.translate(0,0,2);
  modelMatrix.rotate(currentAngle, 0,0,1);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  mvpMatrix.set(vpMatrix).multiply(modelMatrix);
  
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts1.length/floatsPerVertex);
}

function drawMyTree(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
  //modelMatrix.translate(1.5,-1.5,0);
    pushMatrix(modelMatrix);
    modelMatrix.translate(0,0,0.4)
    modelMatrix.scale(0.8,0.8,0.2);
    pushMatrix(modelMatrix);  // new
    modelMatrix.rotate(g_angle02,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  // new
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,1);
    pushMatrix(modelMatrix);  // new
    modelMatrix.rotate(-g_angle01*2,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  // new
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,1);
    modelMatrix.rotate(g_angle02*4,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.translate(0,0,0.2);
    modelMatrix.scale(0.08,0.08,0.2);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex); }

function drawFish(g_modelMatrix, g_modelMatLoc, u_MvpMatrix, u_NormalMatrix){
    pushMatrix(g_modelMatrix); // cubeish shape w spinny triangles
		g_modelMatrix.translate(-0.5, -0.5, 0.0);
		g_modelMatrix.scale(0.2, 0.2, 0.2);
		// Make it smaller:
		g_modelMatrix.rotate(g_angle01, 1, 0, 1);  // Spin on XY diagonal axis
		// DRAW CUBE:		Use ths matrix to transform & draw
		//						the second set of vertices stored in our VBO:
		g_modelMatrix.translate(g_translate, g_translate * 0.2, 2);
		
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
		gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex + 12, 48);    
		
		pushMatrix(g_modelMatrix);
	
			// side triangles 
		
			g_modelMatrix.scale(0.5, 0.5, 0.5);
			
			g_modelMatrix.rotate(-90,0,0,1);
			g_modelMatrix.rotate(-20,0,1,0);
			g_modelMatrix.translate(0,-3, 0);

			g_modelMatrix.rotate(g_angle01 * 2, 0, 1, 0);

			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, 12);

		g_modelMatrix = popMatrix();
		pushMatrix(g_modelMatrix);
			
	
			g_modelMatrix.translate(0,-0.2, 1);
	
			g_modelMatrix.rotate(-45,0,1,0);
			g_modelMatrix.rotate(-65,1,0,0);

			g_modelMatrix.translate(-0.5,0, 0);
	
			g_modelMatrix.rotate(-g_angle02 * 5, 0, 1, 0);
			
			g_modelMatrix.scale(0.4, 0.4, 0.4);

			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, 4);
		g_modelMatrix = popMatrix();
		pushMatrix(g_modelMatrix);
			
	
			g_modelMatrix.translate(-0.3,-0.2, -0.65);
	
			g_modelMatrix.rotate(25,0,1,0);
			g_modelMatrix.rotate(75,1,0,0);

			g_modelMatrix.translate(0,0, -0.2);
	
			g_modelMatrix.rotate(-g_angle02 * 5, 0, 1, 0);
			
			g_modelMatrix.scale(0.4, 0.4, 0.4);

			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

			gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, 4);
		g_modelMatrix = popMatrix();
		
	g_modelMatrix = popMatrix();
}


function drawResize() {
  //==============================================================================
  // Called when user re-sizes their browser window , because our HTML file
  // contains:  <body onload="main()" onresize="winResize()">
  
    //Report our current browser-window contents:

    var nuCanvas = document.getElementById('webgl');	// get current canvas
    var nuGl = getWebGLContext(nuCanvas);

    //console.log('g_Canvas width,height=', nuCanvas.width, nuCanvas.height);		
   /*console.log('Browser window: innerWidth,innerHeight=', 
                                  innerWidth, innerHeight);	*/
                                  // http://www.w3schools.com/jsref/obj_window.asp
  
    
    //Make canvas fill the top 3/4 of our browser window:
    var xtraMarginHeight = 16;    // keep a margin (otherwise, browser adds scroll-bars)
    var xtraMarginWidth = 160;
    nuCanvas.width = innerWidth - xtraMarginWidth;
    nuCanvas.height = (innerHeight*3/4) - xtraMarginHeight;
    // IMPORTANT!  Need a fresh drawing in the re-sized viewports.

    draw(nuGl);   // Draw the triangles
  }

/*function resetFrustum(){
    fLeft = -2.0;
    fRight = 2.0;
    fBottom = -2.0;
    fTop = 2.0;
    fNear = 3.0;
    fFar = 100.0; 
}*/

//==================HTML Button Callbacks

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}
function submit() {
    // Called when user presses 'Submit' button on our webpage
    //		HOW? Look in HTML file (e.g. ControlMulti.html) to find
    //	the HTML 'input' element with id='usrAngle'.  Within that
    //	element you'll find a 'button' element that calls this fcn.
    
    // Read HTML edit-box contents:
        var right = document.getElementById('right').value;	
        var left = document.getElementById('left').value;	
        var bottom = document.getElementById('bottom').value;	
        var top = document.getElementById('top').value;	
        var near = document.getElementById('near').value;	
        var far = document.getElementById('far').value;	
    // Display what we read from the edit-box: use it to fill up
    // the HTML 'div' element with id='editBoxOut':
      /* document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
      console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and */
      /* fRight = parseFloat(right);     // convert string to float number 
      fLeft = parseFloat(left);
      fBottom = parseFloat(bottom);
      fTop = parseFloat(top);
      fNear = parseFloat(near);
      fFar = parseFloat(far); */
    };
  