
/*
 * GET home page.
 */

exports.index = function(req, res){ 
  	var ua = req.header('user-agent');
	    if(/iPhone/i.test(ua) || /Android 4/i.test(ua) || /iPad/i.test(ua)) {
	        res.render('index.mobile.jade',{layout:false});
	    } else if(/Android 2/i.test(ua)){
	        res.render('index.droid2.jade', {layout:false});
        }
        else{
	        res.render('index.jade',{layout:false});
	    }
  
};