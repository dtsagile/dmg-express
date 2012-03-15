// Namespace
if (!this.Phone || typeof this.Phone !== 'object') {
    this.Phone = {};
}

Phone.Controller = (function ($) {
    /////////////////
    //PRIVATE VARIABLES
    var me = {},
    _mapStyle=0,
		_xoffset = 0,
		_yoffset = 0,
		_zoom=8,
		_actionActive = false,
		
		_socket = {};

    /////////////////
    //PRIVATE METHODS
    function _deviceMotionHandler(eventData){
	 	  var ac = eventData.acceleration;//IncludingGravity;
        		  
		  if(ac.z > 2 || ac.z < -2  ){
			var z = 0;
			if(ac.z >0) z=1;
			if(ac.z <0) z=-1;
			 _socket.emit('zoom', {'z': z});  
		}  
	    
	}
      

	function _deviceOrientationHandler(eventData){         
		
		// gamma is the left-to-right tilt in degrees, where right is positive 
		var tiltLR = Math.round(eventData.gamma);
		// beta is the front-to-back tilt in degrees, where front is positive
		var tiltFB = Math.round(eventData.beta);
        $('#tilt').text('LR:'+ tiltLR + ' FB: ' + tiltFB);
        
		//check to see if we are actually tilted demonstrably
		if(Math.abs(tiltLR) > 25 || Math.abs(tiltFB) > 15){
			_xoffset=0;
			_yoffset=0;
			_zoom=0;
			if(tiltLR >= 25 ) _xoffset = 1;
			if(tiltLR <= -25 ) _xoffset = -1;
			if(tiltFB >= 15) _yoffset = 1;
			if(tiltFB <= -15) _yoffset = -1;
			/*
			if(!_actionActive && _zoom != 0){
				_socket.emit('zoom',{'z':_zoom});
				_actionActive = true; 
				$('#action').text('ZOOM');
				//only send this at mode once every 1 second
				setTimeout(function(){
					_actionActive = false;
				},1000);
			}
			 */
			if(!_actionActive){
				_socket.emit('wii',{'x':_xoffset,'y':_yoffset});
				_actionActive = true; 
				$('#action').text('PAN:');
				//only send this at mode once every 1/2 second
				setTimeout(function(){
					_actionActive = false;
				},500);
			}
		   
			
			
		}else{
		   $('#action').text('None'); 
		}
        
	}
 
	me.getSocket = function(){return _socket;};
	me.init = function (args) {
        
        _socket = io.connect();  
        console.log('starting socket');
        _socket.on('connect', function () {
		      console.log('Connected !');
		    });
	   
		                       
		//register the handlers
		//window.addEventListener('devicemotion', _deviceMotionHandler, false); 
		window.addEventListener('deviceorientation', _deviceOrientationHandler, false);
		$('#main').swipeRight(function(){   
		  
		  //zoom in  
		  if(_zoom < 18){
		     _zoom = _zoom +1; 
		     console.log('zooming to ' + _zoom);
		     _socket.emit('zoom',_zoom );
		  }         
		 
		  
		});
		$('#main').swipeLeft(function(){
		  //zoom out 
		  console.log('got pinch in');     
		  if(_zoom > 1){
		    _zoom = _zoom -1;     
		    console.log('zooming to ' + _zoom);
		    _socket.emit('zoom',_zoom );   
		  } 
		});
	  
		
    };

    return me;
	

} ($));
//we pass $ in so js doesn't have to walk the scope chain - $ is now local to this closure.