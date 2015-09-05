

var eventOutputContainer = document.getElementById("message");
var evtSrc = new EventSource("/eventSource");

evtSrc.onmessage = function(e) {
 console.log('data received: ' + e.data);
 eventOutputContainer.innerHTML = e.data;
};

var tooltip = d3.select("body")
	.append("div")
	.attr("class", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden");
	// .text("a simple tooltip");

var tooltip_title = tooltip.append("p").attr("class", "tooltip")
var tooltip_text = tooltip.append("p").attr("class", "tooltip")


var map = L.map('map').setView([39.907236, 116.401079], 15);

//initialize leaflet
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
maxZoom: 18,
id: 'danilnagy.7dba0108',
accessToken: 'pk.eyJ1IjoiZGFuaWxuYWd5IiwiYSI6ImVobm1tZWsifQ.CGQL9qrfNzMYtaQMiI-c8A'
}).addTo(map);


var svgML = d3.select(map.getPanes().overlayPane).append("svg")
			.attr("width",window.innerWidth)
			.attr("height",window.innerHeight),

	gML = svgML.append("g").attr("class", "leaflet-zoom-hide");

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

var transform = d3.geo.transform({point: projectPoint}),
path = d3.geo.path().projection(transform);

//call function to get data on first page load
updateData();

function toggleOverlay(status){
	if (status) {
		gML.selectAll("rect").attr("fill-opacity", ".2")
	}else{
		gML.selectAll("rect").attr("fill-opacity", "0")
	}
}

function uncheckAll(){
	var checks = document.getElementsByName("checkbox");
    for(var i = 0; i < checks.length; i++){
		checks[i].checked = false;
	}
}

function toggleCheck(id){
	var c = document.getElementById(id);
	var checked = c.checked ;

	uncheckAll()

	if (checked) {
		c.checked = true;
		toggleOverlay(true);
	}else{
		toggleOverlay(false);
	}
}

function whichIsChecked(){
	var checks = document.getElementsByName("checkbox");
	for(var i = 0; i < checks.length; i++){
		if (checks[i].checked == true){
			return checks[i].id;
		}
	}
	return null
}

function resCheck(){
	var resObj = document.getElementById('res');
	var resVal = parseInt(resObj.value);


	if (resVal >= 5 && resVal <= 25){
		return resVal;
	}else{
		resObj.value = 10;
		return 10;
	}
	
}

function updateData(){

	mapBounds = map.getBounds();
	lat1 = mapBounds["_southWest"]["lat"];
	lat2 = mapBounds["_northEast"]["lat"];
	lng1 = mapBounds["_southWest"]["lng"];
	lng2 = mapBounds["_northEast"]["lng"];

	// res = 10;
	var w = window.innerWidth;
	var h = window.innerHeight;
	var numW = Math.floor(w/res);
	var numH = Math.floor(h/res);

	var offsetLeft = (w - numW * res) / 2.0 ;
	var offsetTop = (h - numH * res) / 2.0 ;
	
	

	// var c = document.getElementById('HM');

	res = resCheck();
	type = whichIsChecked();


	request = "/updateData?lat1=" + lat1 + "&lat2=" + lat2 + "&lng1=" + lng1 + "&lng2=" + lng2 + "&w=" + w + "&h=" + h + "&res=" + res + "&type=" + type
	console.log(request);

	// if (c.checked) {
	// 	request = request + "&w=" + w + "&h=" + h + "&res=" + res + "&HM=" + "1"
	// }else{
	// 	request = request + "&HM=0"
	// }

  	d3.json(request, function(data) {

  		console.log(data);
		//remove any existing circles on map
		d3.selectAll("circle").remove()

		//create placeholder circle geometry and bind it to data
		var feature = g.selectAll("circle")
		.data(data.points.features)
		.enter().append("circle")
			.on("mouseover", function(d){
				tooltip.style("visibility", "visible");
				tooltip_title.text(d.properties.name);
				tooltip_text.text("Price: " + d.properties.price);
			})
			.on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");});;


	  map.on("viewreset", reset);
	  reset();

	  if (type != null) {
	  	var rectFeature = gML.selectAll("rect").data(data.analysis);
			rectFeature.enter().append("rect");
			rectFeature.exit().remove()


	  	var TL = latlngPoint(lat2, lng1);

		    svgML 
		        .style("left", (TL.x) + "px")
		        .style("top", (TL.y) + "px");

		    rectFeature
	    	.attr("x", function(d) { return d.x; })
	    	.attr("y", function(d) { return d.y; })
	    	.attr("width", function(d) { return d.width; })
	    	.attr("height", function(d) { return d.height; })
	    	.attr("fill", function(d) { return "hsl(" + Math.floor((1-d.val)*250) + ", 100%, 50%)"; })
	    	.attr("fill-opacity", ".2");
}

	  // Reposition the SVG to cover the features.
	  function reset() {

	  	gML.selectAll("rect").remove()

	    var bounds = path.bounds(data.points),
	        topLeft = bounds[0],
	        bottomRight = bounds[1];

	    console.log(bounds);

	    svg .attr("width", bottomRight[0] - topLeft[0] + 500)
	        .attr("height", bottomRight[1] - topLeft[1] + 500)
	        .style("left", (topLeft[0] - 250) + "px")
	        .style("top", (topLeft[1] - 250) + "px");

	    g   .attr("transform", "translate(" + (-topLeft[0] + 250) + "," + (-topLeft[1] + 250) + ")");

	    feature
	    	.attr("cx", function(d) { return latlngPoint(d.geometry.coordinates[1], d.geometry.coordinates[0]).x; })
	    	.attr("cy", function(d) { return latlngPoint(d.geometry.coordinates[1], d.geometry.coordinates[0]).y; })
	    	.attr("r", function(d) { return Math.pow(d.properties.price,.3); })
	  }

  	});


}