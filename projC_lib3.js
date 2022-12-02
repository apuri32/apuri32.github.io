// global vars
 var floatsPerVertex = 12; 
 var isBlinn = -1;
 var whichAttFunc = 0;
 var isTex = 1;
 
 // Lights
 var lamp0 = new LightsT();  // mouse light
 var lamp1 = new LightsT();  // camera 
 var lamp2 = new LightsT();  // fixed ceiling lamp
 var lamp0On = 1;  // lamp 0 is on -> 1, otherwise 0.
 var lamp1On = 0;  // lamp 1 is on -> 1, otherwise 0.
 var lamp2On = 0;  // lamp 2 is on -> 1, otherwise 0.
 
 var amb = [0.3, 0.3, 0.0]; //rgb vals 
 var dif = [1.0, 1.0, 1.0];
 var spe = [1.0, 1.0, 1.0];
 var dark = [0.0, 0.0, 0.0];  
 
 lamp0.I_pos.elements.set([2.0, 1.0, 3.0]);
 lamp0.I_ambi.elements.set(amb);
 lamp0.I_diff.elements.set(dif);
 lamp0.I_spec.elements.set(spe);
 
 lamp1.I_pos.elements.set([-2.0, 1.0, 3.0]);  
 lamp1.I_ambi.elements.set(amb);
 lamp1.I_diff.elements.set(dif);
 lamp1.I_spec.elements.set(spe);
 
 lamp2.I_pos.elements.set([0, 0, 5.0]);
 lamp2.I_ambi.elements.set(amb);
 lamp2.I_diff.elements.set(dif);
 lamp2.I_spec.elements.set(spe); 

 // Materials	
 var matlSel0 = MATL_PEWTER;
 var matl0 = new Material(matlSel0);
 
function VBObox0() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
      
        this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
      'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
      //
      'uniform mat4 u_ModelMat0;\n' +
      'attribute vec4 a_Pos0;\n' +
      'attribute vec3 a_Colr0;\n'+
      'varying vec3 v_Colr0;\n' +
      //
      'void main() {\n' +
      '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
      '	 v_Colr0 = a_Colr0;\n' +
      ' }\n';
    
        this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec3 v_Colr0;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
      '}\n';

      makeGroundGrid();
      makeAxis();
    
      var totalSize = gndVerts.length + axisVerts.length;
      var n = totalSize / 7;
      var vertices = new Float32Array(totalSize);
  
      gndStart = 0;
      for (i = 0, j = 0; j < gndVerts.length; i++, j++){
          vertices[i] = gndVerts[j];
      }
      axisStart = i;
      for(j = 0; j< axisVerts.length; i++, j++) {
          vertices[i] = axisVerts[j];
      }
  
      this.vboContents = vertices;					// # of vertices held in 'vboContents' array
      this.vboVerts = n;
      this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                      // bytes req'd by 1 vboContents array element;
                                                                    // (why? used to compute stride and offset 
                                                                    // in bytes for vertexAttribPointer() calls)
      this.vboBytes = this.vboContents.length * this.FSIZE;               
                                    // total number of bytes stored in vboContents
                                    // (#  of floats in vboContents array) * 
                                    // (# of bytes/float).
        this.vboStride = this.vboBytes / this.vboVerts; 
                                      // (== # of bytes to store one complete vertex).
                                      // From any attrib in a given vertex in the VBO, 
                                      // move forward by 'vboStride' bytes to arrive 
                                      // at the same attrib for the next vertex. 
    
                    //----------------------Attribute sizes
      this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                    // attribute named a_Pos0. (4: x,y,z,w values)
      this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
      console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                      this.vboFcount_a_Colr0) *   // every attribute in our VBO
                      this.FSIZE == this.vboStride, // for agreeement with'stride'
                      "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
                  //----------------------Attribute offsets  
        this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                      // of 1st a_Pos0 attrib value in vboContents[]
      this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                    // (4 floats * bytes/float) 
                                    // # of bytes from START of vbo to the START
                                    // of 1st a_Colr0 attrib value in vboContents[]
                    //-----------------------GPU memory locations:
        this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                      // returned by gl.createBuffer() function call
        this.shaderLoc;								// GPU Location for compiled Shader-program  
                                        // set by compile/link of VERT_SRC and FRAG_SRC.
                                              //------Attribute locations in our shaders:
        this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
        this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    
                    //---------------------- Uniform locations &values in our shaders
        this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
        this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    }
    
    VBObox0.prototype.init = function() {
    //=============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
        this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
        if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
        gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
        this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
    
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                                          this.vboContents, 		// JavaScript Float32Array
                                       gl.STATIC_DRAW);			// Usage hint.
      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
      // c1) Find All Attributes:---------------------------------------------------
      //  Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
      this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
      if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                                '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;	// error exit.
      }
         this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
      if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                                '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;	// error exit.
      }
      
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
        this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
      if (!this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                                '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
      }  
    }
    
    VBObox0.prototype.switchToMe = function() {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
        gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                                            this.vboLoc);			    // the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
        //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
            this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
            this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
            gl.FLOAT,			// type == what data type did we use for those numbers?
            false,				// isNormalized == are these fixed-point values that we need
                                        //									normalize before use? true or false
            this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                          // stored attrib for this vertex to the same stored attrib
                          //  for the next vertex in our VBO.  This is usually the 
                                        // number of bytes used to store one complete vertex.  If set 
                                        // to zero, the GPU gets attribute values sequentially from 
                                        // VBO, starting at 'Offset'.	
                                        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
            this.vboOffset_a_Pos0);						
                          // Offset == how many bytes from START of buffer to the first
                                      // value we will actually use?  (We start with position).
      gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                            gl.FLOAT, false, 
                            this.vboStride, this.vboOffset_a_Colr0);
                                  
    // --Enable this assignment of each of these attributes to its' VBO source:
      gl.enableVertexAttribArray(this.a_PosLoc);
      gl.enableVertexAttribArray(this.a_ColrLoc);
    }
    
    VBObox0.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
    var isOK = true;
    
      if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                                '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                              '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;
    }
    
    VBObox0.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.adjust() call you needed to call this.switchToMe()!!');
      }  
        // Adjust values for our uniforms,
    
            this.ModelMat.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    //  this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    // READY to draw in 'world' coord axes.
        

     var m = new Matrix4(); // use if g_worldMat isnt a thin
    m.setScale(0.5, 0.5, 0.5);
    this.ModelMat.set(vpMatrix).multiply(m);
    gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
     //  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
    //  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
      //  Transfer new uniforms' values to the GPU:-------------
      // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
                                              false, 				// use matrix transpose instead?
                                              this.ModelMat.elements);	// send data from Javascript.
      // Adjust the attributes' stride and offset (if necessary)
      // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    }
    
    VBObox0.prototype.draw = function() {
    //=============================================================================
    // Render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.draw() call you needed to call this.switchToMe()!!');
      }  
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                                      0, 								// location of 1st vertex to draw;
                                      this.vboVerts);		// number of vertices to draw on-screen.
    }
    
    VBObox0.prototype.reload = function() {
    //=============================================================================
    // Over-write current values in the GPU inside our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.
    
     gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                      0,                  // byte offset to where data replacement
                                          // begins in the VBO.
                                          this.vboContents);   // the JS source-data array used to fill VBO
    
    }



// Without light
function VBObox1() {
    this.VERT_SRC =
    'precision highp float;\n' +

    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Colr0;\n'+
    'attribute vec4 a_Normal;\n' +  // placeholder for vertbuffer

    'uniform mat4 u_MvpMat;\n' +
    'uniform mat4 u_ModelMat;\n' +  // placeholder

    'varying vec4 v_Color;\n' +

    'void main() {\n' +
    '   vec4 noUse = u_ModelMat * a_Normal;\n' +
    '   gl_Position = u_MvpMat * a_Pos0 + 0.001 * noUse;\n' +
    '   v_Color = vec4(a_Colr0, 1.0);\n' + 
    ' }\n';
  
    this.FRAG_SRC = 
    'precision highp float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_Color;\n' + 
    '}\n';

    
    makeSphere();  
    makeCube();
    makePyramid();

    mySiz = /* cylVerts.length + */ sphVerts1.length /* + 
    torVerts.length */ + cubeVerts.length + pyrVerts.length;
    var n = mySiz / floatsPerVertex;
    console.log('n is', n, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

    var vertices = new Float32Array(mySiz);

    sphStart = 0;						// next, we'll store the sphere;
	for(i = 0,j=0; j< sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
		vertices[i] = sphVerts1[j];
		}
    cubeStart = i;
    for (j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }

    /* cylStart = i;
  for(j=0; j<cylVerts.length; i++,j++) {
    vertices[i] = cylVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		vertices[i] = torVerts[j];
		}*/

    this.vboContents = vertices;
    this.vboVerts = n; 
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
    this.vboBytes = this.vboContents.length * this.FSIZE;  
    this.vboStride = this.vboBytes / this.vboVerts;  

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    this.vboFcount_a_Tex0 = 2;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0 + this.vboFcount_a_Tex0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
}

VBObox1.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }
    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
}

VBObox1.prototype.switchToMe = function() { // same but cleaned up
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 ); 
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox1.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }
}

VBObox1.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  //sphere
    
    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(1.5,-1.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(-1.5,2.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(3,-1.0,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(2,2,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    }

VBObox1.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}



//vbo box2
// Gouroud 
function VBObox2() {
    this.VERT_SRC =
    '#ifdef GL_ES\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    '#endif\n' +
    'struct LampT0 {\n' +
    '   vec3 pos;\n' +	
    ' 	vec3 a;\n' +	
    ' 	vec3 d;\n' +	
    '	vec3 s;\n' +	
    '}; \n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec3 a_Colr0;\n'+ 

    'uniform int u_lamp0On;\n' +
    'uniform int u_lamp1On;\n' +
    'uniform int u_lamp2On;\n' +
    'uniform int u_isBlinn;\n' +
    'uniform int u_whichAttFunc;\n' +

    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'uniform mat4 u_MvpMat;\n' +

    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform LampT0 u_LampSet[3];\n' +  // Array of all lights
    'uniform vec4 u_eyePosWorld;\n' +  // Eye location in world coords

    'varying vec4 v_Color;\n' +  

    'float attFunc(float dis, int whichAttFunc);\n' +  // declare a att function

    'void main() {\n' +
    '   vec3 ambient = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 diffuse = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 specular = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 emissive = vec3(0.0, 0.0, 0.0);\n' +
    '   float se0;\n' +
    '   float se1;\n' +
    '   float se2;\n' +

    '   gl_Position = u_MvpMat * a_Pos0;\n' +
    '   vec4 vertexPos = u_ModelMat * a_Pos0;\n' +  // Calculate world coord. of vertex
    '   vec3 eyeDirection = normalize(u_eyePosWorld.xyz - vertexPos.xyz); \n' + 
    '   vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +  // Calculate normal
    '   vec3 Kd0 = u_MatlSet[0].d * a_Colr0;\n' + 
    '   if(u_lamp0On == 1){\n' +
    '       vec3 lightDirection0 = normalize(u_LampSet[0].pos - vertexPos.xyz);\n' +  // Calculate light direction
    '       float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att0 = attFunc(distance(u_LampSet[0].pos, vertexPos.xyz), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' + 
    '           vec3 H0 = normalize(lightDirection0 + eyeDirection); \n' +
    '           float nDotH0 = max(dot(H0, normal), 0.0); \n' +
    '           se0 = pow(nDotH0, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +
    '           vec3 R0 = reflect(-lightDirection0, normal);\n' +
    '           float r0DotV = max(dot(R0, eyeDirection), 0.0);\n' +
    '           se0 = pow(r0DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[0].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[0].d * Kd0 * nDotL0 * att0;\n' +
    '	    specular += u_LampSet[0].s * u_MatlSet[0].s * se0 * att0;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +
    '   if(u_lamp1On == 1){\n' +
    // Second Light is from Camera/Eye pos, so lightDirection is same as eyeDirection.
    '       float nDotL1 = max(dot(eyeDirection, normal), 0.0);\n' +  // lamp1 is from eye direction
    '       float att1 = attFunc(distance(u_eyePosWorld.xyz, vertexPos.xyz), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' + 
    '           vec3 H1 = normalize(eyeDirection + eyeDirection); \n' +
    '           float nDotH1 = max(dot(H1, normal), 0.0); \n' +
    '           se1 = pow(nDotH1, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +
    '           vec3 R1 = reflect(-eyeDirection, normal);\n' +
    '           float r1DotV = max(dot(R1, eyeDirection), 0.0);\n' +
    '           se1 = pow(r1DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[1].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[1].d * Kd0 * nDotL1 * att1;\n' +
    '	    specular += u_LampSet[1].s * u_MatlSet[0].s * se1 * att1;\n' +
    '	    emissive += u_MatlSet[0].e;\n' +
    '   }\n' +
    '   if(u_lamp2On == 1){\n' +
    '       vec3 lightDirection2 = normalize(u_LampSet[2].pos - vertexPos.xyz);\n' +  // Calculate light direction
    '       float nDotL2 = max(dot(lightDirection2, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att2 = attFunc(distance(u_LampSet[2].pos, vertexPos.xyz), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' + 
    '           vec3 H2 = normalize(lightDirection2 + eyeDirection); \n' +
    '           float nDotH2 = max(dot(H2, normal), 0.0); \n' +
    '           se2 = pow(nDotH2, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +
    '           vec3 R2 = reflect(-lightDirection2, normal);\n' +
    '           float r2DotV = max(dot(R2, eyeDirection), 0.0);\n' +
    '           se2 = pow(r2DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[2].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[2].d * Kd0 * nDotL2 * att2;\n' +
    '	    specular += u_LampSet[2].s * u_MatlSet[0].s * se2 * att2;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +
    '   v_Color = vec4(ambient + diffuse + specular + emissive, 1.0);\n' + 
    ' }\n' +
    'float attFunc(float dis, int whichAttFunc){\n' +
    '   if (whichAttFunc == 0){\n' +
    '       return 1.0;\n' +
    '   }\n' +
    '   if (whichAttFunc == 1){\n' +
    '       return 1.0/dis;\n' +
    '   }\n' +
    '   if (whichAttFunc == 2){\n' +
    '       return 1.0/pow(dis, 2.0);\n' +
    '   }\n' +
    '}\n';
  
    this.FRAG_SRC = 
    'precision highp float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_Color;\n' + 
    '}\n';

    
    makeSphere();  
    makeCube();
    makePyramid();
    var mySiz = sphVerts1.length + cubeVerts.length + pyrVerts.length;;
    var n = mySiz / floatsPerVertex;
    var vertices = new Float32Array(mySiz);

    sphStart = 0;
    for (i = 0, j = 0; j < sphVerts1.length; i++, j++){
        vertices[i] = sphVerts1[j];
    }
    cubeStart = i;
    for (j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }
    
    this.vboContents = vertices;
    this.vboVerts = n;  
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
    this.vboBytes = this.vboContents.length * this.FSIZE;
    this.vboStride = this.vboBytes / this.vboVerts;

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    this.vboFcount_a_Tex0 = 2;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0 + this.vboFcount_a_Tex0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
    this.u_NormalMatrix;
    this.u_eyePosWorld;

    this.u_Ka0;
    this.u_Ks0;
    this.u_Ke0;
    this.u_Kshiny0;

    this.lamp0 = new LightsT();
    this.lamp0.u_pos;
    this.lamp0.u_ambi;
    this.lamp0.u_diff;
    this.lamp0.u_spec;

    this.lamp1 = new LightsT();
    this.lamp1.u_pos;
    this.lamp1.u_ambi;
    this.lamp1.u_diff;
    this.lamp1.u_spec;

    this.lamp2 = new LightsT();
    this.lamp2.u_pos;
    this.lamp2.u_ambi;
    this.lamp2.u_diff;
    this.lamp2.u_spec;
}

VBObox2.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }

    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_lamp0On = gl.getUniformLocation(this.shaderLoc, 'u_lamp0On');
    this.u_lamp1On = gl.getUniformLocation(this.shaderLoc, 'u_lamp1On');
    this.u_lamp2On = gl.getUniformLocation(this.shaderLoc, 'u_lamp2On');
    if (!this.u_lamp0On || !this.u_lamp1On || !this.u_lamp2On) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp switches.');
        return;
    }
    this.u_isBlinn = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_whichAttFunc = gl.getUniformLocation(this.shaderLoc, 'u_whichAttFunc');

    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_MvpMatLoc || !this.u_NormalMatrix  || !this.u_eyePosWorld || !this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for uniforms');
        return;
    }

    this.lamp0.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].a');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].d');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].s');

    this.lamp1.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos');
    this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].a');
    this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].d');
    this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].s');

    this.lamp2.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].pos');
    this.lamp2.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].a');
    this.lamp2.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].d');
    this.lamp2.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].s');

    this.u_Ka0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].a');
    this.u_Kd0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].d');
    this.u_Ks0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].s');
    this.u_Ke0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].e');
	this.u_Kshiny0 = gl.getUniformLocation(gl.program, 'u_MatlSet[0].se');
    if(!this.lamp0.u_pos || !this.lamp0.u_ambi || !this.lamp0.u_diff || !this.lamp0.u_spec ) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp0.');
        return;
    }
    if(!this.lamp1.u_pos || !this.lamp1.u_ambi || !this.lamp1.u_diff || !this.lamp1.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp1.');
        return;
    }
    if(!this.lamp2.u_pos || !this.lamp2.u_ambi || !this.lamp2.u_diff || !this.lamp2.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp2.');
        return;
    }
    if(!this.u_Ka0 || !this.u_Kd0 || !this.u_Ks0 || !this.u_Ke0) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for material0.');
        return;
    }
}

VBObox2.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 );  
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox2.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.uniform4f(this.u_eyePosWorld, eyeX, eyeY, eyeZ, 1.0);

    gl.uniform3fv(this.lamp0.u_pos, lamp0.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp0.u_ambi, lamp0.I_ambi.elements); 
    gl.uniform3fv(this.lamp0.u_diff, lamp0.I_diff.elements);
    gl.uniform3fv(this.lamp0.u_spec, lamp0.I_spec.elements);

    gl.uniform3fv(this.lamp1.u_pos, lamp1.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp1.u_ambi, lamp1.I_ambi.elements); 
    gl.uniform3fv(this.lamp1.u_diff, lamp1.I_diff.elements);
    gl.uniform3fv(this.lamp1.u_spec, lamp1.I_spec.elements);

    gl.uniform3fv(this.lamp2.u_pos, lamp2.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp2.u_ambi, lamp2.I_ambi.elements); 
    gl.uniform3fv(this.lamp2.u_diff, lamp2.I_diff.elements);
    gl.uniform3fv(this.lamp2.u_spec, lamp2.I_spec.elements);

    gl.uniform3fv(this.u_Ke0, matl0.K_emit.slice(0,3));
	gl.uniform3fv(this.u_Ka0, matl0.K_ambi.slice(0,3));
    gl.uniform3fv(this.u_Kd0, matl0.K_diff.slice(0,3));
    gl.uniform3fv(this.u_Ks0, matl0.K_spec.slice(0,3));
    gl.uniform1i(this.u_Kshiny0, parseInt(matl0.K_shiny));

    gl.uniform1i(this.u_lamp0On, lamp0On);
    gl.uniform1i(this.u_lamp1On, lamp1On);
    gl.uniform1i(this.u_lamp2On, lamp2On);

    gl.uniform1i(this.u_isBlinn, isBlinn);
    gl.uniform1i(this.u_whichAttFunc, whichAttFunc);
}

VBObox2.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  //sphere
    
    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(1.5,-1.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(-1.5,2.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(3,-1.0,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(2,2,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();}

VBObox2.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}


//vbo box 3
// Phong Shading
function VBObox3() {
    this.VERT_SRC =
    'precision highp float;\n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec3 a_Colr0;\n'+ 

    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'uniform mat4 u_MvpMat;\n' +

    'varying vec3 v_Kd0;\n' +
    'varying vec3 v_Pos;\n' +
    'varying vec3 v_Normal;\n' +

    'void main() {\n' +
    '   gl_Position = u_MvpMat * a_Pos0;\n' +
    '   v_Pos = vec3(u_ModelMat * a_Pos0);\n' +  // Calculate world coord. of vertex
    '   v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +  // Calculate normal
    '   v_Kd0 = u_MatlSet[0].d * a_Colr0;\n' +
    ' }\n';
  
    this.FRAG_SRC = 
    '#ifdef GL_ES\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    '#endif\n' +
    'struct LampT0 {\n' +
    '   vec3 pos;\n' +	
    ' 	vec3 a;\n' +	
    ' 	vec3 d;\n' +	
    '	vec3 s;\n' +	
    '}; \n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'uniform int u_lamp0On;\n' +
    'uniform int u_lamp1On;\n' +
    'uniform int u_lamp2On;\n' +
    'uniform int u_isBlinn;\n' +
    'uniform int u_whichAttFunc;\n' +
    'uniform LampT0 u_LampSet[3];\n' +  // Array of all lights
    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform vec4 u_eyePosWorld;\n' +  // Eye location in world coords

    'varying vec3 v_Kd0;\n' +
    'varying vec3 v_Pos;\n' +
    'varying vec3 v_Normal;\n' +

    'float attFunc(float dis, int whichAttFunc);\n' +  // declare a att function

    'void main() {\n' +
    '   vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Pos); \n' +
    '   vec3 normal = normalize(v_Normal);\n' +  // Normalized normal again
    '   vec3 ambient = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 diffuse = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 specular = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 emissive = vec3(0.0, 0.0, 0.0);\n' +
    '   float se0;\n' +
    '   float se1;\n' +
    '   float se2;\n' +

    '   if(u_lamp0On == 1){\n' +
    '       vec3 lightDirection0 = normalize(u_LampSet[0].pos - v_Pos);\n' +  // Calculate light direction
    '       float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att0 = attFunc(distance(u_LampSet[0].pos, v_Pos), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' +  // Blinn
    '           vec3 H0 = normalize(lightDirection0 + eyeDirection); \n' +
    '           float nDotH0 = max(dot(H0, normal), 0.0); \n' +
    '           se0 = pow(nDotH0, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +  // Phong
    '           vec3 R0 = reflect(-lightDirection0, normal);\n' +
    '           float r0DotV = max(dot(R0, eyeDirection), 0.0);\n' +
    '           se0 = pow(r0DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[0].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[0].d * v_Kd0 * nDotL0 * att0;\n' +
    '	    specular += u_LampSet[0].s * u_MatlSet[0].s * se0 * att0;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +

    '   if(u_lamp1On == 1){\n' +  // Blinn
    // Second Light is from Camera/Eye pos, so lightDirection is same as eyeDirection.
    '       float nDotL1 = max(dot(eyeDirection, normal), 0.0);\n' +  // lamp1 is from eye direction
    '       float att1 = attFunc(distance(u_eyePosWorld.xyz, v_Pos), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' +  // Blinn
    '           vec3 H1 = normalize(eyeDirection + eyeDirection); \n' +
    '           float nDotH1 = max(dot(H1, normal), 0.0); \n' +
    '           se1 = pow(nDotH1, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +  // Phong
    '           vec3 R1 = reflect(-eyeDirection, normal);\n' +
    '           float r1DotV = max(dot(R1, eyeDirection), 0.0);\n' +
    '           se1 = pow(r1DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[1].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[1].d * v_Kd0 * nDotL1 * att1;\n' +
    '	    specular += u_LampSet[1].s * u_MatlSet[0].s * se1 * att1;\n' +
    '	    emissive += u_MatlSet[0].e;\n' +
    '   }\n' +

    '   if(u_lamp2On == 1){\n' +
    '       vec3 lightDirection2 = normalize(u_LampSet[2].pos - v_Pos);\n' +  // Calculate light direction
    '       float nDotL2 = max(dot(lightDirection2, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att2 = attFunc(distance(u_LampSet[2].pos, v_Pos), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' +  // Blinn
    '           vec3 H2 = normalize(lightDirection2 + eyeDirection); \n' +
    '           float nDotH2 = max(dot(H2, normal), 0.0); \n' +
    '           se2 = pow(nDotH2, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +  // Phong
    '           vec3 R2 = reflect(-lightDirection2, normal);\n' +
    '           float r2DotV = max(dot(R2, eyeDirection), 0.0);\n' +
    '           se2 = pow(r2DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[2].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[2].d * v_Kd0 * nDotL2 * att2;\n' +
    '	    specular += u_LampSet[2].s * u_MatlSet[0].s * se2 * att2;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +

    '   gl_FragColor = vec4(ambient + diffuse + specular + emissive, 1.0);\n' + 
    '}\n' +
    'float attFunc(float dis, int whichAttFunc){\n' +
    '   if (whichAttFunc == 0){\n' +
    '       return 1.0;\n' +
    '   }\n' +
    '   if (whichAttFunc == 1){\n' +
    '       return 1.0/dis;\n' +
    '   }\n' +
    '   if (whichAttFunc == 2){\n' +
    '       return 1.0/pow(dis, 2.0);\n' +
    '   }\n' +
    '}\n';

   
    makeSphere(); 
    makeCube();
    makePyramid();
    
    
    var mySiz = /* cylVerts.length + */ sphVerts1.length /* + 
    torVerts.length */ + cubeVerts.length + pyrVerts.length;
    var n = mySiz / floatsPerVertex;
    var vertices = new Float32Array(mySiz);

   
    sphStart = 0;
    for (i = 0,j = 0; j < sphVerts1.length; i++, j++){
        vertices[i] = sphVerts1[j];
    }
    cubeStart = i;
    for (j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }

    this.vboContents = vertices;
    this.vboVerts = n;  
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
    this.vboBytes = this.vboContents.length * this.FSIZE;  
    this.vboStride = this.vboBytes / this.vboVerts;  

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    this.vboFcount_a_Tex0 = 2;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0 + this.vboFcount_a_Tex0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
    this.u_NormalMatrix;
    this.u_eyePosWorld;

    this.u_Ka0;
    this.u_Ks0;
    this.u_Ke0;
    this.u_Kshiny0;

    this.lamp0 = new LightsT();
    this.lamp0.u_pos;
    this.lamp0.u_ambi;
    this.lamp0.u_diff;
    this.lamp0.u_spec;

    this.lamp1 = new LightsT();
    this.lamp1.u_pos;
    this.lamp1.u_ambi;
    this.lamp1.u_diff;
    this.lamp1.u_spec;

    this.lamp2 = new LightsT();
    this.lamp2.u_pos;
    this.lamp2.u_ambi;
    this.lamp2.u_diff;
    this.lamp2.u_spec;
}

VBObox3.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }

    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_lamp0On = gl.getUniformLocation(this.shaderLoc, 'u_lamp0On');
    this.u_lamp1On = gl.getUniformLocation(this.shaderLoc, 'u_lamp1On');
    this.u_lamp2On = gl.getUniformLocation(this.shaderLoc, 'u_lamp2On');
    if (!this.u_lamp0On || !this.u_lamp1On || !this.u_lamp2On) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp switches.');
        return;
    }
    this.u_isBlinn = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_whichAttFunc = gl.getUniformLocation(this.shaderLoc, 'u_whichAttFunc');

    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_MvpMatLoc || !this.u_NormalMatrix  || !this.u_eyePosWorld || !this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for uniforms');
        return;
    }

    this.lamp0.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].a');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].d');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].s');

    this.lamp1.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos');
    this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].a');
    this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].d');
    this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].s');

    this.lamp2.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].pos');
    this.lamp2.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].a');
    this.lamp2.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].d');
    this.lamp2.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[2].s');

    this.u_Ka0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].a');
    this.u_Kd0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].d');
    this.u_Ks0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].s');
    this.u_Ke0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].e');
	this.u_Kshiny0 = gl.getUniformLocation(gl.program, 'u_MatlSet[0].se');
    if(!this.lamp0.u_pos || !this.lamp0.u_ambi || !this.lamp0.u_diff || !this.lamp0.u_spec ) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp0.');
        return;
    }
    if(!this.lamp1.u_pos || !this.lamp1.u_ambi || !this.lamp1.u_diff || !this.lamp1.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp1.');
        return;
    }
    if(!this.lamp2.u_pos || !this.lamp2.u_ambi || !this.lamp2.u_diff || !this.lamp2.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp2.');
        return;
    }
    if(!this.u_Ka0 || !this.u_Kd0 || !this.u_Ks0 || !this.u_Ke0) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for material0.');
        return;
    }

}

VBObox3.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 );  
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox3.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.uniform4f(this.u_eyePosWorld, eyeX, eyeY, eyeZ, 1.0);

    gl.uniform3fv(this.lamp0.u_pos, lamp0.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp0.u_ambi, lamp0.I_ambi.elements); 
    gl.uniform3fv(this.lamp0.u_diff, lamp0.I_diff.elements);
    gl.uniform3fv(this.lamp0.u_spec, lamp0.I_spec.elements);

    gl.uniform3fv(this.lamp1.u_pos, lamp1.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp1.u_ambi, lamp1.I_ambi.elements); 
    gl.uniform3fv(this.lamp1.u_diff, lamp1.I_diff.elements);
    gl.uniform3fv(this.lamp1.u_spec, lamp1.I_spec.elements);

    gl.uniform3fv(this.lamp2.u_pos, lamp2.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp2.u_ambi, lamp2.I_ambi.elements); 
    gl.uniform3fv(this.lamp2.u_diff, lamp2.I_diff.elements);
    gl.uniform3fv(this.lamp2.u_spec, lamp2.I_spec.elements);

    gl.uniform3fv(this.u_Ke0, matl0.K_emit.slice(0,3));
	gl.uniform3fv(this.u_Ka0, matl0.K_ambi.slice(0,3));
    gl.uniform3fv(this.u_Kd0, matl0.K_diff.slice(0,3));
    gl.uniform3fv(this.u_Ks0, matl0.K_spec.slice(0,3));
    gl.uniform1i(this.u_Kshiny0, parseInt(matl0.K_shiny));

    gl.uniform1i(this.u_lamp0On, lamp0On);
    gl.uniform1i(this.u_lamp1On, lamp1On);
    gl.uniform1i(this.u_lamp2On, lamp2On);

    gl.uniform1i(this.u_isBlinn, isBlinn);
    gl.uniform1i(this.u_whichAttFunc, whichAttFunc);
}

VBObox3.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  //sphere

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(1.5,-1.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(-1.5,2.5,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(3,-1.0,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    this.ModelMat.translate(2,2,0);
    drawMyTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // tree

    this.ModelMat = popMatrix();
    }

VBObox3.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}
