//This depends on socket.io being loaded into the page
IOWrapper = function (){
   console.log('initing IOWrapper...');
	var self = this;
   this._socket = io.connect(); 
   this._socket.on('updateMap', function (data) {
		console.log('IOWrapper: got updateMap...') ;	 	
		self.trigger('updateMap', data);
	});
	 
	this._socket.on('pointAdded', function(data){
		console.log('IOWrapper: got PointAdded...') ;
		self.trigger('pointAdded', data);
	}); 

	this._socket.on('toggleAppState', function(data){
		console.log('IOWrapper: got toggleAppState...') ; 
		self.trigger('toggleAppState', data);
	}); 
	
	this._socket.on('wii', function(data){
	   console.log('IOWrapper: wii: ' + data.x  + data.y);
	   self.trigger('wii', data);
	});
	this._socket.on('zoom',function(data){
		console.log('IOWrapper: got zoom ' + data);
		self.trigger('zoom', data);
		
	}); 
	this._socket.on('userCountUpdate', function(data){
		console.log('IOWrapper: got userCountUpdate...');
		self.trigger('userCountUpdate', data);
	});
	
	this._socket.on('currentData', function(data){
	    console.log('IOWrapper: got currentPoints...');
	    //now loop over the array of stuff, and add to the map 
	   
	    var pt = {};
	    $(data).each(function(idx,el){ 
	        
	        pt = {
                pointType: el.attributes.PointType,  
                lat: el.geometry.y, 
                lng: el.geometry.x
            };
            self.trigger('pointAdded', pt); 
	    });  
	    
	    
	});
	
	//----- END CONTSTRUCTOR --------
     
	
	this.addMapPoint = function(data){
		this._socket.emit('addMapPoint', data);
	};   
	this.pushMapState = function(data){
	   this._socket.emit('pushMapState', data);
	};
	this.toggleAppState=function(data){
	   this._socket.emit('toggleAppState', data); 
	};
	this.getPoints =function(){
	  this._socket.emit('getPoints', '', function(data){
	      console.log('Got data:', data);
	  });  
	}; 
	
	
};   
MicroEvent.mixin(IOWrapper);
