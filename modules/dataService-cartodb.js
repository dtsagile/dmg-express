var sys = require('sys'),
    querystring = require('querystring'),
    oAuth = require('oauth').OAuth,
    util = require('util'),    

    // setup - based on CartoDB implementation
    _username = 'dts',
    _password = 'cmrs1996',
    _key = 'S0n8mqe6tjNeS3kSe2sJcHfEjtNSWVzODMqDFX7O',
    _secret = '3551rSJcQahvQRM7lUpb9gq4CmNJwbIxwZ9MXGNA',
    _requestUrl = 'https://' + _username + '.cartodb.com/oauth/request_token',
    _accessUrl = 'https://' + _username + '.cartodb.com/oauth/access_token',
    _apiUrl = 'https://' + _username + '.cartodb.com/api/v1/sql',
    _auth = new oAuth(_requestUrl, _accessUrl, _key, _secret, "1.0", null, "HMAC-SHA1"),
    _xAuth = { x_auth_mode:"client_auth", x_auth_username: _username, x_auth_password: _password },
    // an 'enum' to represent the types of queries/actions that will be performed 
    _queryType = {
        insert: 1
    },
    
    _handleRequest = function(queryType, data, onSuccess, onError) {
        console.log('Getting OAuth request key...');
        // get an OAuth key
        _auth.getOAuthRequestToken (function(error, key, secret, result) {
            if (error) {
                console.log('...Error getting OAuth request key:');
                console.log(sys.inspect(error));
                throw new Error("Unable to obtain OAuth request key."); 
            } else {
                console.log('...Received OAuth request key.');
                console.log('Getting access tokens via XAuth...');
                
                // get an xAuth token--required by CartoDB API
                _auth.post(_accessUrl, key, null, _xAuth, null, function(error, result) {
                    
                    if(error) {
                        console.log('...Access tokens request via XAuth failed:');
                        console.log(sys.inspect(error));
                        throw new Error("Access tokens request via XAuth failed. Please check your password and username."); 
                    } else {                       
                        console.log('...Received access tokens via XAuth.');
                        var accessTokens = querystring.parse(result),
                        query = "";
                        
                        switch(queryType) {
                            case _queryType.insert:
                                query = util.format("insert into assessment_point (the_geom, point_type, created_by) values (ST_GeomFromText('SRID=4326;POINT(%d %d)'), '%s', '%s')", data.x, data.y, data.pointType, data.createdBy);
                                console.log('Saving data:');
                                console.log(sys.inspect(data));
                                break;
                        } 
                        
                        if(query !== "") {
                            console.log('Executing SQL query...');
                            console.log(query);
                            // execute the query
                            _auth.post(_apiUrl, accessTokens['oauth_token'], accessTokens['oauth_token_secret'], { q: query }, null, function (error, data, response) {
                                if(error) {
                                    console.log("...Execution of SQL query failed:");
                                    console.log(sys.inspect(error));
                                    throw new Error("...Execution of SQL query failed.");
                                }
                                if(typeof onSuccess === "function") {
                                    onSuccess();
                                }
                            });
                        }
                    }
                });
            }
        });
    };

// exposes functionality to the app for insert 
exports.insert = function(data, success, error) {
    _handleRequest(_queryType.insert, data, success, error);
}


