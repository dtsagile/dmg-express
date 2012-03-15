// Namespace
if (!this.Map || typeof this.Map !== 'object') {
    this.Map = {};
}
//This is our static module
Map.Controller = (function ($) {
    /////////////////
    //PRIVATE VARIABLES
    var me = {},
        _map,
        _currentEvents = {},
        _disasterLayer,
        _ioWrapper = {},
        _addPointMapHandler = {},
        _isDriver = false,
        _currentMarkerType = '',
        _session = Map.Session;

    /////////////////
    //PRIVATE METHODS
    function _initMap(){
        _map = new L.Map('map');
        var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/e157614f2e585e679ee4a14551192a57/997/256/{z}/{x}/{y}.png',
            cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';
        _disasterLayer = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttrib});
        var start = new L.LatLng(44.15068, -103.40332); // the venerable null island 
                                
        _map.setView(start, 4).addLayer(_disasterLayer);
        
        _map.on('zoomend', function(e) {
            if(_isDriver){
                console.log('zoomend: ' +  e.target.getCenter() + e.target.getZoom()); // e is an event object (MouseEvent in this case)
                var ctr = e.target.getCenter();
                _ioWrapper.pushMapState({lat: ctr.lat, lng: ctr.lng, zoom: e.target.getZoom()});
            }
        });
        
        //When the map is panned, send the
        _map.on('dragend', function(e) {
            
            if(_isDriver){
                console.log('dragend: ' + e.target.getCenter() + e.target.getZoom()); // e is an event object (MouseEvent in this case)
                var ctr = e.target.getCenter();
                _ioWrapper.pushMapState({lat: ctr.lat, lng: ctr.lng, zoom: e.target.getZoom()});
            }
        });
    }

   


    //--------------------------------------
    //setup events and socket.io
    //--------------------------------------
    function _initIO(){  
        //setup the ioWapper
        _ioWrapper = new IOWrapper();  
        
        //Get the existing points right away...
        _ioWrapper.getPoints(); 
        
        _ioWrapper.bind('updateMap', function(data){
            console.log('Got Update Map during init ' + data.lat + ' ' + data.lng + ' ' + data.zoom);
            _map.setView(new L.LatLng(data.lat,data.lng), data.zoom);    
        });
        _ioWrapper.bind('pointAdded', _addPointToMap);
        
        _ioWrapper.bind('wii', function(data){
            console.log('Got wii:', data);
            var s = _map.getSize().y / 2; 
           _map.panBy(new L.Point(data.x * s,data.y * s)); 
        });
        
        _ioWrapper.bind('zoom',function(data){
          _map.setZoom(data);
        });  

		    _ioWrapper.bind('userCountUpdate', function(data){ 
		      console.log('updating user count...', data);
		      $('#userCount').text(' Current Users: ' + data.count);
		    });
        
    }
    
    
    
    function _getMarker(markerType) {
        var iconUrl = 'images/'.concat(markerType).concat('.png'),
        icon = L.Icon.extend({   
            iconSize: new L.Point(32, 37),
            shadowSize: new L.Point(47, 37),
            iconAnchor: new L.Point(13, 35),
            shadowUrl: 'images/custom-marker-shadow.png',
            iconUrl: iconUrl
        });
        return new icon();
    }
        
    //add a point to the map
    function _addPointToMap(data) {
        //console.log('Adding point to the map... Marker:' + data.pointType);   
        _incrementEvents(data.pointType);
        _map.addLayer(new L.Marker(new L.LatLng(data.lat, data.lng), { icon: _getMarker(data.pointType)}));
    }  
    
    function _incrementEvents(eventName){
      if(_currentEvents.hasOwnProperty(eventName)){
             _currentEvents[eventName] = _currentEvents[eventName] + 1;            
      }else{
             _currentEvents[eventName] = 1;
      }  
      //update the message
      $('#current').text('Last 24 hours:' +  _getCurrentEventsString());
    }  
    
    function _getCurrentEventsString(){
      //create a sensible human readable message string based on what's in the
      //_currentEvents hashmap
      var msg = '';
      if(_currentEvents.hasOwnProperty('deaths')){
        msg += ' ' +  _currentEvents['deaths'] + ' Deaths ';
      }
      if(_currentEvents.hasOwnProperty('fire')){
        msg += ' ' + _currentEvents['fire'] + ' Fires ';
      }
      if(_currentEvents.hasOwnProperty('road-damage')){
        msg +=  ' ' + _currentEvents['road-damage'] + ' Road Damage ';
      } 
      if(_currentEvents.hasOwnProperty('destroyed-building')){
        msg += ' ' + _currentEvents['destroyed-building'] + ' Destroyed Buildings ';
      }
      if(_currentEvents.hasOwnProperty('damaged-building')){
        msg += ' ' + _currentEvents['damaged-building'] + ' Damaged Buildings ';
      }  
      if(msg === ''){msg = 'No Hazards Reported.'}    
      return msg;
    }
    
    // invoke user selection of point type            
    function _addPointMapClickHandler(e) {
        var data = {
            pointType: _currentMarkerType,  
            lat: e.latlng.lat, 
            lng: e.latlng.lng
        };  
        console.log('got a point...' , data);
        // send the message
        _ioWrapper.addMapPoint(data); 
        _addPointToMap(data);
        $('#message').text('');
        _map.off('click', _addPointMapClickHandler);
    } 
    

    ////////////////
    //PUBLIC METHODS
    me.setDriver = function (val) { _isDriver = val;};
    me.getMap = function () { return _map; };
    me.init = function (args) {
        //_initUI();
        _initMap();
        _initIO();
        $('#toggle-drive').bind('click', function(){
              
            _isDriver = !_isDriver;
            $('#toggle-drive').toggleClass('ui-btn-active');
            if(_isDriver){
                  $('#toggle-drive').text('Stop Driving');
            } else{
                  $('#toggle-drive').text('Drive Map'); 
            } 

        });
        
        $('#add-point').bind('click', function(){
            //bind up a click event to the map
            console.log('setting up map click event')
            _map.on('click', _addPointMapClickHandler);
        });
        
        $('#drawing').on('click', 'li', function(evt){
            _currentMarkerType = $(this).data('type');
            $('#message').text('Click on map to set point location.');
            _map.on('click', _addPointMapClickHandler); 
        });

    };

    return me;

} ($));
//we pass $ in so js doesn't have to walk the scope chain - $ is now local to this closure.