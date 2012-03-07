
/*
 * GET home page.
 */

exports.index = function(req, res){ 
  	var ua = req.header('user-agent');
	    if(/iPhone/i.test(ua)) {
	        res.render('index.mobile.jade',{layout:false});
	    } else {
	        res.render('index.jade',{layout:false});
	    }
  
};