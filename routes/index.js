
/*
 * GET home page.
 */

exports.index = function(req, res){ 
  	var ua = req.header('user-agent'); 
  	
	  if(/iPhone/i.test(ua) || /Android 4/i.test(ua) || /iPad/i.test(ua)) {
	    //iPhone, Android 4 & iPad 
	    res.render('index.mobile.jade',{layout:false}); 
	        
	  } else if(/Android 2/i.test(ua)) {
	     //Android 2 gets a less exciting version
	     res.render('index.droid2.jade', {layout:false}); 
	        
    } else {
       //desktops and everything else
	     res.render('index.jade',{layout:false});
	  }
};