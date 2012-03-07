/* Stuff used by all versions */

// Namespace
if (!this.Map || typeof this.Map !== 'object') {
    this.Map = {};
}

Map.Marker = (function() {

    var _markerType = {
        damagedBuilding: 'Damaged Building',
        destroyedBuilding: 'Destroyed Building',
        activeFire: 'Fire (active)',
        injuries: 'Injuries',
        deaths: 'Deaths',
        roadDamage: 'Road Damage',
        roadImpassable: 'Road Impassable',
        bridgeDamage: 'Bridge Damage'
    };

    _markerType.find = function(val) {
        for(var item in this) {
            if(this[item] === val)
                return item.toString().toDash();
        }
    };
    
    return {
        markerType: _markerType,
    };
    
    
}($));

Map.Session = (function() {
    var _get = function() {
        return window.name === "" ? "" : JSON.parse(window.name);
    },
    _exists = function() {
        return window.name !== "";
    },
    _toString = function() {
        var user = _get();
        return _exists() 
            ? String.format('{0} | {1}', user.screenname, user.email)
            : "";
    },
    _login = function(data, isSuccess) {
        
        if(isSuccess) {
            window.name = JSON.stringify(data);
            if($.unblockUI) {
                $.unblockUI({
                    onUnblock: function() {
                        $('#sign-in').hide();
                    }
                });
            } else {
                $('#sign-in').dialog('close');
                $.mobile.changePage('#home');
            }
            $('#user').show().find('span').html(Map.Session.toString());
        } else {
            $('#errors').html('').append(String.format('<p>The e-mail address &#39;{0}&#39; is already in use.</p>', data.email)).show();
        }
        
    },
    _logout = function() {
        window.name = "";
        window.location.reload();
    };
    
    return {
        login: function(data, isSuccess) { 
            _login(data, isSuccess); 
        },
        logout: function() { _logout(); },
        exists: function() { return _exists(); },
        get: function() { return _get(); },
        toString: function() { return _toString(); }
    };
    
}($));

// extend things to make them more useful
String.prototype.toCamel = function(){
    return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

String.prototype.toDash = function(){
    return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};

String.format = function() {
    for(var i = 0; i < arguments.length; i++) {
        var arg = arguments[i], 
        regex = new RegExp("\\{".concat(i).concat("\\}"), "gi");
        arguments[0] = arguments[0].replace(regex, arguments[i + 1]);
    };
    return arguments[0];
};

String.prototype.isEmailAddress = function(){  
   var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;  
   return emailPattern.test(this);  
}  

String.prototype.isEmpty = function(){  
   return /^\s{1,}$/.test(this) || this.length === 0
} 


