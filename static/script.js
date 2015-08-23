var map = L.map('map').setView([39.907236, 116.401079], 15);

//initialize leaflet
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
maxZoom: 18,
id: 'danilnagy.7dba0108',
accessToken: 'pk.eyJ1IjoiZGFuaWxuYWd5IiwiYSI6ImVobm1tZWsifQ.CGQL9qrfNzMYtaQMiI-c8A'
}).addTo(map);

//create variable to store path to svg and g elements
var svg = d3.select(map.getPanes().overlayPane).append("svg"),
	g = svg.append("g").attr("class", "leaflet-zoom-hide");

// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
	var point = map.latLngToLayerPoint(new L.LatLng(y, x));
	this.stream.point(point.x, point.y);
}
function latlngPoint(x, y) {
	return map.latLngToLayerPoint(new L.LatLng(x, y));
}

//call function to get data on first page load
updateData();

//function to get data
function updateData() {

	//get map bounderies from leaflet
	mapBounds = map.getBounds();
	console.log(mapBounds);
	lat1 = mapBounds["_southWest"]["lat"];
	lat2 = mapBounds["_northEast"]["lat"];
	lng1 = mapBounds["_southWest"]["lng"];
	lng2 = mapBounds["_northEast"]["lng"];
	console.log(lat1, lat2, lng1, lng2);

	//get data from server using http request
	d3.json("/listings?lat1=" + lat1 + "&lat2=" + lat2 + "&lng1=" + lng1 + "&lng2=" + lng2, function(data) {

		var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);

		//remove any existing circles on map
		d3.selectAll("circle").remove()

		//create placeholder circle geometry and bind it to data
		var feature = g.selectAll("cirlce")
		.data(data.features)
		.enter().append("circle");

	  map.on("viewreset", reset);
	  reset();

	  // Reposition the SVG to cover the features.
	  function reset() {
	    var bounds = path.bounds(data),
	        topLeft = bounds[0],
	        bottomRight = bounds[1];

	    svg .attr("width", bottomRight[0] - topLeft[0] + 500)
	        .attr("height", bottomRight[1] - topLeft[1] + 500)
	        .style("left", (topLeft[0] - 250) + "px")
	        .style("top", (topLeft[1] - 250) + "px");

	    g   .attr("transform", "translate(" + (-topLeft[0] + 250) + "," + (-topLeft[1] + 250) + ")");

	    feature
	    	.attr("cx", function(d) { return latlngPoint(d.geometry.coordinates[1], d.geometry.coordinates[0]).x; })
	    	.attr("cy", function(d) { return latlngPoint(d.geometry.coordinates[1], d.geometry.coordinates[0]).y; })
	    	.attr("r", function(d) { return Math.pow(d.properties.price,.3); });
	  }


	});

}