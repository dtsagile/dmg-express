var util = require('util'),
    querystring = require('querystring'),
	http = require('http'),
    //util = require('util'),    
    
	hostName = 'ags2.dtsagile.com'
    

	//get features added within the last 24 hours
	_queryFeatures = function(onSuccess, onError){
    //http://ags2.dtsagile.com/ArcGIS/rest/services/EMS/DamageAssessments/FeatureServer/0/
    //query?objectIds=&where=1%3D1&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&s
    //patialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&outSR=&returnCountOnly=false&returnIdsOnly=false&f=pjson
        var nd = new Date();
        var dateString = (nd.getMonth() + 1) + '/' + nd.getDate() + '/' + nd.getFullYear();
        
        var query = {
            'where' :'EntryDate > \'' + dateString + '\'',
            'outFields':'*',
            'returnGeometry':true ,
            'f':'json',
            'outSR':'4326'
        };  
      console.log(query); 
	    var options = {
	        host: hostName,
	        port:'80',
	        path:'/ArcGIS/rest/services/EMS/DamageAssessments/FeatureServer/0/query?' +  querystring.stringify(query),  
	        method:'GET'
	    }; 	    
	   
	    var req = http.get(options, function(res) {
            var pageData = "";
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              pageData += chunk;
            });

            res.on('end', function(){
  	          resJson = JSON.parse(pageData); 
  	          //console.log('Features: ', resJson.features)
  	          onSuccess(resJson.features);
            });
          }); 
          
	};
    
    _getCurrentTicks = function(){
        var date = new Date();
		    return date.getTime() - (date.getTimezoneOffset() * 60000);
    };
    
    
    _addFeature = function(data, onSuccess, onError) {
        console.log('Starting call to AddFeatures...'); 
        var ticks = _getCurrentTicks();
		var feature = [{
			'geometry':{
					'x':data.x,
					'y':data.y,
					'spatialReference': {'wkid' : 4326}
			},
			'attributes':{
		      'PointType' : data.pointType,
		      'EntryDate': ticks,
		      'UserName': 'magic'
		     }
		}]; 
		
		var post_data = querystring.stringify({
			 'f':'json',
			'features': JSON.stringify(feature)
		});
		  
		console.log('...PostData:')
    console.log(JSON.stringify(post_data));
		 // An object of options to indicate where to post to
		 var options = {
		     host: hostName,
		     port: '80',
		     path: '/ArcGIS/rest/services/EMS/DamageAssessments/FeatureServer/0/addFeatures',
		     method: 'POST',
		     headers: {
		         'Content-Type': 'application/x-www-form-urlencoded',
		         'Content-Length': post_data.length
		     }
		 };     
        
		var req = http.request(options); 
		
		req.on('response', function(res) {
		  console.log('STATUS: ' + res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res.headers));  
		  res.body ='';
		  res.setEncoding('utf8');
		
		  res.on('data', function (chunk) {
		    //console.log('BODY: ' + chunk); 
			  res.body += chunk;
		  });
		 
		  res.on('end',function(){
			console.log('got the response... ');
			//this should be called when the response is fully loaded...
			console.log(res.body);
			resJson = JSON.parse(res.body);
			if(resJson.addResults[0].success == true){ 
				console.log('...feature inserted successfully')
				if(typeof onSuccess === "function") { 
					console.log('...calling the success callback')
		            onSuccess();
		        } else{
			       console.log('...no callback passed in.')
				}
			}else{
			   console.log('Error inserting feature'); 
			}
			
		  })
		});

		req.on('error', function(e) {
		  console.log('...problem with request: ' + e.message);
		});

		// write data to request body
		req.write(post_data);
		req.end();  

    }; 


// exposes functionality to the app for insert 
exports.insert = function(data, success, error) {
    _addFeature(data, success, error);
    
}   
exports.query = function(success, error){
    _queryFeatures(success,error);
}


