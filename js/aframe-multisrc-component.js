//aframe multisrc component

AFRAME.registerComponent('multisrc', {
  
  dependencies: ['material'],
      
  schema: {
      srcs: {
          default: [],
          parse: function (value) {
              if ( value.length == 0 ){
                return "nada"
              }
              else{
                return value.split(',');
              }
          }
      },
      srcspath: {type: 'string', default: ''},
  },//end schema

  init: function () {
      
      //get the number of 'sides' (groups) of the shape this is attached to
      this.sides = this.el.getObject3D('mesh').geometry.groups.length
    
      //make an empty array to load some new materials into
      this.materials = []

      //make new materials and add them to array
      this.makeMaterials();
      
      //style the new materials by inheriting from default material component
      this.styleMaterials();

      //update the mesh with new materials array
      this.el.getObject3D('mesh').material = this.materials
    
      //set up listeners for changes in default material
      this.materialListener();
      
      //reduce material componentchanged event throttle so animations can run in real time
      this.reduceMaterialChangedThrottle(0);
      
  },//end init
  
  makeMaterials: function() {
  
      //get the number of sides of the geometry make a separate material for each
      for(i=0;i<this.sides;i++){

        //add plain new material to array, give it a unique name
        this.materials.push( new THREE.MeshStandardMaterial({ name: 'material-' + i + ''}) )

      }//end for images loop
  
  },//end makeMaterials
  
  update: function (){
      
      //if there are no images defined, do nothing
      if ( this.data.srcs == "nada" ){
      }
      //else add the images
      else{
        //add images from schema to materials
        this.addSrcs();
      }
      
  },//end update
  
  addSrcs: function(){
      
      //make a 3js loader for textures
      var loader = new THREE.TextureLoader();
    
      //use number of images from schema as a loop
      for(i=0;i<this.data.srcs.length;i++){
    
          //get as many materials as there are images
          var material = this.materials[i]

          //get each asset whether is pointing to a preloaded asset or a straight URL
          var src = this.data.srcs[i]
          var asset;
          var inline = false
          //if its not a preloaded asset, its a file name/path
          if ( document.getElementById( src.replace('#','') ) === null ){ 
            asset = src
            inline = true
          }
          //otherwise its an asset 
          else{
            asset = document.getElementById( src.replace('#','') ).src
            inline = false
          }

          //combine asset string with srcpath
          var fullasset = this.data.srcspath+asset
 
          //check if src is image
          if ( fullasset.includes('.jpg') || fullasset.includes('.jpeg') || fullasset.includes('.png')  ){ 
            
              //give each material the image asset
              material.map = loader.load(fullasset)
          }
          //else its a video, need to do a bit more
          else{
              //if its not a preloaded asset, its a file name/path and we have to make a video element
              var video;
            
              if ( inline = true ){ 
                
                video = document.createElement('video')
                video.src = fullasset
                video.crossOrigin = 'anonymous';
                video.loop = true;
                video.preload = 'auto';
                video.load();
                video.play(); 
                
              }
              //otherwise its an asset 
              else{
                
                video = document.getElementById( src.replace('#','') )
                video.src = fullasset
                video.load();
                
              }
            
              var texture = new THREE.VideoTexture(video);
              texture.needsUpdate;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBFormat;
              material.map = texture
          }
 
      }//end for images loop
    
  },//end addImages
  
  materialListener: function() {
      
      //to listen for changes in material component
      
      var self = this //can't get this inside eventListener
      
      //make this a separate function so I can remove it later
      this.compChange = function (evt) {
          //if its the material that has changed then style the materials
          if ( evt.detail.name == 'material' ){
            self.styleMaterials();
          }
      }//end compChange
      
      //check for component changes and then run the above compchange function
      this.el.addEventListener('componentchanged', this.compChange);
    
  },//end materialListener
  
  styleMaterials: function(){
    
      //to inherit changes from material component
    
      //get attached material component styles to copy
      var styles = this.el.components.material.material  
      
      //get number of sides and loop through them
      for(i=0;i<this.sides;i++){
    
        //get each material
        var material = this.materials[i]
        
          //get the difference between default material and our material
          var a = material
          var b = styles
          var diff = AFRAME.utils.diff (a, b)

            //use the different styles to style the materials unless it is the uuid, map or name 
            for (var key in diff) {
                if (material.hasOwnProperty(key)) {

                    //if its the uuid, map or name don't copy
                    if ( key == 'uuid' || key == 'map' || key == 'name' ){
                    }
                    //else copy it over
                    else{
                      material[key] = styles[key]
                    }

                }//end if has own property
            }//end for keys in data
        
      }//end for images loop
  
  },//end styleMaterials
  
  granularChange: function (materialIndex) {
      
      //get and return a specific material/side for styling individually - advanced
      var material = this.el.getObject3D('mesh').material[materialIndex]
      return material
    
  },//end granularChange
  
  reduceMaterialChangedThrottle: function(throttle){
  
      //change throttle on material componentchanged so as to update quickly enough for animations, from 200 to 0
      var material = this.el.components.material
      
      material.throttledEmitComponentChanged = AFRAME.utils.throttle(function emitChange () { 
        material.el.emit('componentchanged', material.evtDetail, false); 
      }, throttle);
    
  },//end reduceMaterialChangedThrottle:
  
  remove: function(){
    
    //removes this multimaterial from mesh, adds the default material back on, removes event listeners and puts material componentchanged throttle back to normal
    
    //get the default material
    var defaultMaterial = this.el.components.material.material 
    
    //update the mesh with default material
    this.el.getObject3D('mesh').material = defaultMaterial
    
    //remove componentchanged eventlistener
    this.el.removeEventListener('componentchanged', this.compChange);
    
    //put component changed throttle back to normal
    this.reduceMaterialChangedThrottle(200);
    
  },//end remove

});//end multisrc