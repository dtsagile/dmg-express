
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , Connect = require('connect')
  , assetManager = require('connect-assetmanager');

var app = module.exports = express.createServer();


// Configuration  for asset management (put into another file)
var assetsManagerMiddleware = assetManager({
	'js':{
	     'debug':true
		,'route':/\/js\/app.js/
		, 'path': './public/javascripts/'
		        , 'dataType': 'javascript'
		        , 'files': ['zepto.js','microevent.js','SocketWrapper.js', 'leaflet.js', 'Map.Controller.js']
    }, 
	'js-mobile':{
		'route':/\/js\/app.mobile.js/
		, 'path': './public/javascripts/'
		        , 'dataType': 'javascript'
		        , 'files': ['zepto.js','microevent.js','SocketWrapper.js', 'leaflet.js','move.js', 'Map.Mobile.Controller.js']
     },  

	'css': {
        'route': /\/css\/app.css/
        , 'path': './public/stylesheets/'
        , 'dataType': 'css'
        , 'files': ['reset.css', 'map.css','leaflet.css' ]
	}
	
	,'css-mobile': {
        'route': /\/css\/app.mobile.css/
        , 'path': './public/stylesheets/'
        , 'dataType': 'css'
        , 'files': ['leaflet.css','menu.vertical.css', 'map.mobile.css']
	} 
	
	,'css-mobile-droid2': {
        'route': /\/css\/app.mobile.droid2.css/
        , 'path': './public/stylesheets/'
        , 'dataType': 'css'
        , 'files': ['leaflet.css','menu.vertical.droid2.css', 'map.mobile.css']
	}
	   
}); 
//assetsManagerMiddleware.debug(true);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(assetsManagerMiddleware);
  app.use(express.static(__dirname + '/public')); 
  //app.register('.haml', require('hamljs'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});      



// Routes 
app.get('/', routes.index); 
app.get('/wii', function(req, res){
  res.render('wiiphone', { layout: false })
}); 

app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);   
                    
//This is really all about the socketio part of the app
var sio = io.listen(app);  
var dataService = require('./modules/dataService-esrifs');
var userCount = 0; 
//force xhr-polling b/c firewalls at the conference center will likely block websockets
sio.set('transports', [
  'xhr-polling'
//,'websockets'
]);

sio.sockets.on('connection', function (socket) {  
	userCount++;
	socket.broadcast.emit('userCountUpdate', {count: userCount});
   
    //when pushMapState comes in...
    socket.on('pushMapState', function (data) {
        console.log('Got pushMapState' + ' lat:'  +data.lat + ' lng:'  +data.lng + ' z:'  +data.zoom);
        //send it back out...
        socket.broadcast.emit('updateMap', { lat:data.lat, lng:data.lng , zoom:data.zoom })
        console.log('Broadcast updateMap...');
    });  
    
    socket.on('getPoints', function(){
        dataService.query(function(res){
            //should we pump them one at a time, or just shoot the data back? 
            console.log('Got data out of the dataService: ', res);
            socket.emit('currentData',res); 
        }); 
    });
    
    // when addPoint comes in...
    socket.on('addMapPoint', function(data, onAddPoint) {
        // make a call to save the point to the db     
        console.log('addMapPoint called');
        dataService.insert({ x: data.lng, y: data.lat, pointType: data.pointType }, function() {  
            console.log('Got addPoint: type: ' + data.pointType + ' lat:' + data.lat + ' lng:' + data.lng);
            socket.broadcast.emit('pointAdded', { lat:data.lat, lng:data.lng , pointType:data.pointType });
            console.log('Broadcast pointAdded...');
            if(typeof onAddPoint === 'function')
                onAddPoint();
        });
    });  

	socket.on('mode-change', function(data){  
		console.log('got mode change to ' + data.mode);
		socket.broadcast.emit('mode-change', data);
	});   
	
	socket.on('mapStyleChange', function(data){
	   socket.broadcast.emit('mode-change', data); 
	});    
	
	socket.on('wii', function(data){
		socket.broadcast.emit('wii', {x:data.x,y:data.y});
	}) ;
	 
	socket.on('zoom', function(data){  
		console.log('Got wii Zoom: ' + data.z);  
		socket.broadcast.emit('zoom', data);
	});   
	socket.on('disconnect', function () {
		userCount--;  
		console.log('got socket disconnect... now ' + userCount + ' users.');
		socket.broadcast.emit('userCountUpdate', {count: userCount}); 
	});                    
	                                                
});
