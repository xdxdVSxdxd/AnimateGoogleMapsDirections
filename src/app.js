$( document ).ready(function() {
 
  // do your standard jQuery stuff here
 
});


// we will store our paths here
// the polylines in Google Maps' Directions service
var paths = new Array();

// this will contain the instance of the Directions service
var directionsService;

// the Map
var map;

// the Heatmap which we will use to animate the directions
var heatmap;

// this is the array of points which will be passed 
// to the Heatmap and which we will add points to
// to animate the paths
var heatPointArray;

// some timers for animations and getting paths
var timerGeneratePaths = null;
var timeranimate = null;

// a variable in which we will store the distance along a path
var distance;


function initMap() {

	map = new google.maps.Map(document.getElementById('viz'), {
	  center: {lat: 41.9, lng: 12.5},  // this is Rome! :)
	  zoom: 11,
	  disableDefaultUI: true,
	  zoomControl: false,
	  mapTypeControl: false,
	  scaleControl: false,
	  streetViewControl: false,
	  rotateControl: false,
	  fullscreenControl: false
	});
    
  heatPointArray = new google.maps.MVCArray();

  heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatPointArray,
      map: map
  });

  // we will set a custom color gradient for the Heatmap
  var gradienttraffic = [
          'rgba(0, 255, 0, 0)',
          'rgba(0, 255, 0, 1)',
          'rgba(50, 255, 0, 1)',
          'rgba(150, 80, 0, 1)',
          'rgba(255, 60, 0, 1)',
          'rgba(255, 0, 0, 1)'
  ];
  heatmap.set('gradient',gradienttraffic);

  // get the instance of the Directions service
	directionsService  = new google.maps.DirectionsService();


  // just for testing, we will generate directions to go
  // from random points on the map, generating them
  // so that they fall within min/max latitude and longitude
  // (around Rome)

	minlat = 41.8;
	maxlat = 42;

	minlng = 12.4;
	maxlng = 12.6;

	if(timerGeneratePaths!=null){
		clearInterval( timerGeneratePaths  );
	}
	timerGeneratePaths = setInterval(generatePaths,5000);  // every 5 seconds	

	if(timeranimate!=null){
		clearInterval( timeranimate  );
	}
	timeranimate = setInterval(animate,2000);	// every 2 seconds

}

function generatePaths(){

  // let's generate a random start and end point
  // (hoping that there are streets nearby, so that
  // Google Maps can snap to them, to generate the directions
  
	var startLat = randomFromInterval(minlat,maxlat);
	var startLng = randomFromInterval(minlng,maxlng);

	var endLat = randomFromInterval(minlat,maxlat);
	var endLng = randomFromInterval(minlng,maxlng);

	var request = {
		origin: new google.maps.LatLng(startLat, startLng),
		destination: new google.maps.LatLng(endLat, endLng),
		travelMode: 'DRIVING'
	};

	directionsService.route(request, function(result, status) {
		if (status == 'OK') {
			
			/*
			$.post("saveDirection.php",
				{
					'payload': JSON.stringify(result)
				},
				function(data, textStatus){
					//
				}
			);
			*/

			var o = new Object();


			var polyline = new google.maps.Polyline({
			  path: [],
			  strokeColor: '#FF0000',
			  strokeWeight: 3
			});
			var distance = 0;
			var legs = result.routes[0].legs;
			for (i=0;i<legs.length;i++) {
			  var steps = legs[i].steps;
			  distance = distance + legs[i].distance.value;
			  for (j=0;j<steps.length;j++) {
			    var nextSegment = steps[j].path;
			    for (k=0;k<nextSegment.length;k++) {
			      polyline.getPath().push(nextSegment[k]);
			    }
			  }
			}

			//polyline.setMap(map);



			o.poly = polyline;
			o.distance = distance;
			o.currentDistance = 0;

			paths.push( o );

			//console.log(o);

		}
	});


}
