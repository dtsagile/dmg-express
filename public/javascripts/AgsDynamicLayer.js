L.AgsDynamicLayer = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        minZoom: 0,
        maxZoom: 18,
        attribution: '',
        opacity: 1,
        layers: null,
        format: 'PNG8',
        transparent: 'true',
        defintionQuery: '',

        unloadInvisibleTiles: L.Browser.mobileWebkit
    },

    initialize: function (/*String*/url, /*Object*/options) {
        L.Util.setOptions(this, options);
        this._url = url;
    },

    //public properties that modify the map
    setLayers: function (/*string*/layers) {
        this.options.layers = layers;
        this._updateLayer();
    },

    getLayers: function () {
        return this.options.layers;
    },

    setTransparent: function (transparent) {
        this.options.transparent = transparent;
    },

    getTransparent: function () {
        return this.options.transparent;
    },

    setDefinitionQuery: function (/*string*/query) {
        this.options.defintionQuery = query;
    },

    getDefinitionQuery: function () {
        return this.options.defintionQuery;
    },

    setOpacity: function (opacity) {
        //set it immediately
        if (this._image) {
            this._image.style.opacity = opacity;
            // stupid webkit hack to force redrawing of tiles
            this._image.style.webkitTransform += ' translate(0,0)';
        }
        this.options.opacity = opacity;
    },

    getOpacity: function () {
        return this.options.opacity;
    },

    reset: function () {
        this._reset();
    },

    update: function () {
        var topLeft = this._map.latLngToLayerPoint(this._map.getBounds().getNorthWest()),
                bottomRight = this._map.latLngToLayerPoint(this._map.getBounds().getSouthEast()),
                size = bottomRight.subtract(topLeft);

        L.DomUtil.setPosition(this._image, topLeft);
        this._image.style.width = size.x + 'px';
        this._image.style.height = size.y + 'px';

        this._image.updating = false;
        this._updateLayer();
    },

    show: function () {
        this._image.style.display = 'block';
    },

    hide: function () {
        this._image.style.display = 'none';
    },

    isVisible: function () {
        return this._image.style.display === 'block';
    },

    onAdd: function (map) {
        this._map = map;

        this._reset();

        map.on('viewreset', this._reset, this);
        map.on('moveend', this._moveEnd, this);
        map.on('zoomend', this._zoomEnd, this);
		map.on('movestart', this._moveStart, this);
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._image);
        map.off('viewreset', this._reset, this);
        map.off('moveend', this._moveEnd, this);
        map.off('zoomend', this._zoomEnd, this);
		map.off('movestart', this._moveStart,this);
    },

    _initImage: function () {
        this._image = L.DomUtil.create('img', 'leaflet-image-layer');

        this._image.style.visibility = 'hidden';
        this._image.style.opacity = this.options.opacity;
        this._image.style.display = 'block';
        //TODO createImage util method to remove duplication        
        L.Util.extend(this._image, {
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: this._onImageLoad,
            src: this._getImageUrl(),
            updating: false,
            agsLayer: this,
            map: this._map
        });
        this._map.getPanes().overlayPane.appendChild(this._image);
    },

    _getImageUrl: function () {
        //construct the export image url
        var bnds = this._map.getBounds();
        var sz = this._map.getSize();
        //bboxsr & imagesr params need to be specified like so to avoid alignment problems on some map services - not sure why
        var bbox = 'bbox=' + bnds.getSouthEast().lng + ',' + bnds.getSouthEast().lat + ',' + bnds.getNorthWest().lng + ',' + bnds.getNorthWest().lat + '&bboxsr=4326&imageSR=3857';
        var size = '&size=' + sz.x + ',' + sz.y;
        var format = '&format=' + this.options.format;
        var transparent = '&transparent=' + this.options.transparent;
        var url = this._url + '/export?' + bbox + size + format + transparent + '&f=image';
		if(this.options.definitionQuery){
			url += '&layerDefs=' + this.options.definitionQuery;
		}
        if (this.options.layers) {
            var layers = '&layers=' + this.options.layers;
            url += layers;
        }

        return url; // this._url + '/export?' + bbox + size + layers + format + transparent + '&f=image';
    },

    _updateLayer: function () {
		console.log('_updateLayer Called...')
        if (!this._image.updating) {
			console.log('	Initiating layer update...')
            //console.log('Updating layer NW: ' + map.getBounds().getNorthWest());            
            this._image.updating = true;

            //update the src based on the new location
            this._image.src = this._getImageUrl();

            //reset the image location on the map
            //            //hang the info on the image, we'll actually update it onload to make sure we don't reposition it before the new image comes down
            //this doesn't seem to work on mobile
            //            this._image.topLeft = this._map.latLngToLayerPoint(this._map.getBounds().getNorthWest());
            //            var bottomRight = this._map.latLngToLayerPoint(this._map.getBounds().getSouthEast());
            //            this._image.size = bottomRight.subtract(this._image.topLeft);

            var topLeft = this._map.latLngToLayerPoint(this._map.getBounds().getNorthWest()),
                bottomRight = this._map.latLngToLayerPoint(this._map.getBounds().getSouthEast()),
                size = bottomRight.subtract(topLeft);

            L.DomUtil.setPosition(this._image, topLeft);
            this._image.style.width = size.x + 'px';
            this._image.style.height = size.y + 'px';
            console.log('	updated layer');
        }else{
			console.log('	Layer is already updating...')
		
		}
    },

	_moveStart: function(){
		console.log('MoveStart fired...');
		//Tried to use MoveStart to hide the layer when Zooming, but
		//the event fires too late...
		//this._image.style.display = 'none';
	},

    _moveEnd: function () {
        //console.log('in _moveEnd : NW: ' + map.getBounds().getNorthWest());
        //don't set display:none for moves - makes for smoother panning - no flicker
        //oops, that didn't work on mobile
        this._image.style.display = 'none';
        this._updateLayer();
    },

    _zoomEnd: function () {
        //console.log('in _moveEnd');

        //        //zoom the image...(animate it?)
        //        //L.DomUtil.setPosition(this, this.topLeft);
        //        //debugger;
        //        //it's gonna be something like this but it's not quite right - also will need to get/ calculate the correct factor (using 1.5 below) and change it for zoom out
        //        //and we need to properly calculate the new left and top - just hard coded approximate values below
        //        this._image.style.left = '-420px';
        //        this._image.style.top = '-228px';
        //        this._image.style.width = this._image.width * 1.5 + 'px';
        //        this._image.style.height = this._image.height * 1.5 + 'px';


        //for now, we'll just do this
        this._image.style.display = 'none';
        this._updateLayer();
    },

    _reset: function () {
        if (this._image) {
            this._map.getPanes().overlayPane.removeChild(this._image);
        }
        this._initImage();
        this._updateLayer();
    },

    _onImageLoad: function () {
		//Called when the image has been loaded into the map
        //        //reset the image location on the map - doing it this way does not seem to work on mobile
        //        L.DomUtil.setPosition(this, this.topLeft);
        //        this.style.width = this.size.x + 'px';
        //        this.style.height = this.size.y + 'px';


        //this is the image

        //make sure it's visible and reset the updating flag
        this.style.visibility = 'visible';
        this.style.display = 'block';

        this.updating = false;
    }
});