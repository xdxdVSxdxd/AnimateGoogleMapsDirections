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

// how many segments from our paths we want to travel each step?
var deltadistance = 1;

// we will store the lines we draw on the map here, so that we can update them 
var currentLines = null;

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


	// prepare the request for Google Directions service
	var request = {
		origin: new google.maps.LatLng(startLat, startLng),
		destination: new google.maps.LatLng(endLat, endLng),
		travelMode: 'DRIVING'
	};

	// invoke the service
	directionsService.route(request, function(result, status) {
		if (status == 'OK') {
			
			
			// useful:
			// if we save the responses, we can use them in other scenarios
			// for example here we brutally save them to a json file
			// through a PHP script
			$.post("saveDirection.php",
				{
					'payload': JSON.stringify(result)
				},
				function(data, textStatus){
					// do something
				}
			);
			

			// create an object to keep track of the
			// path we just generated
			var o = new Object();


			// create a Polyline, to hold the line of the path
			var polyline = new google.maps.Polyline({
			  path: [],
			  strokeColor: '#FF0000',
			  strokeWeight: 3
			});
			
			// reset distance
			var distance = 0;
			
			// these are the legs of the path, we take the first returned path here
			// a better version could take all the the optional paths suggested by Google Maps
			var legs = result.routes[0].legs;
			
			// let's use the results to create the segments of the Polyline
			for (i=0;i<legs.length;i++) {
				
				// the leg is composed of steps
			  	var steps = legs[i].steps;
			  	
			  	// let's update the distance
			  	distance = distance + legs[i].distance.value;
			  
			  	for (j=0;j<steps.length;j++) {
			    
			    		// this is the next step of the path
			    		var nextSegment = steps[j].path;
			    		
			    		// get all the pieces
			    		for (k=0;k<nextSegment.length;k++) {
			      			polyline.getPath().push(nextSegment[k]);
			    		}
			  	}
			}

			// we can show the Polyline on the map
			polyline.setMap(map);


			// but most important, let's store it in our object
			// to save it for later, to animate it
			o.poly = polyline;
			
			// this is the total distance of the path
			o.distance = distance;
			
			// this is the distance we currently travelled in the animation
			// it is initialized with 0, to start from the beginning
			o.currentDistance = 0;

			// let's put the path with the others
			paths.push( o );

		}
	});

}


function animate(){

	// check if we are already drawing some lines for the animations
	if(currentLines!=null){
		
		// if we are, take them temporarily off the map
		for(var i = 0; i<currentLines.length; i++){
			currentLines[i].setMap(null);
		}
		
	}
	
	// initialize a new frame for the lines on the map
	currentLines = new Array();

	// take all the paths we generated this far
	for(var i = 0; i<paths.length; i++){
		
		// update the current distance for each path, so we know if we finished it
		paths[i].currentDistance = paths[i].currentDistance+deltadistance;
		
		// if we finished it: start over (or else we could have taken it off the array)
		if(paths[i].currentDistance >= paths[i].poly.getPath().getLength()){
			paths[i].currentDistance = 0;
		}
		
		// take the points on the path which sit at the current distance and the one at the currentdistance + deltadistance, the next point
		var p1 = paths[i].poly.getPath().getAt( paths[i].currentDistance );
		var p2 = paths[i].poly.getPath().getAt(    Math.min( paths[i].distance, (paths[i].currentDistance+deltadistance) )    );

		// push one of them to the array of the heatmap, thus updating it
		heatPointArray.push(  new google.maps.LatLng( p2.lat(), p2.lng() )  );

		// create a line for the current piece of the path
		var line = new google.maps.Polyline({
		    path: [
		    	{lat: p1.lat(), lng: p1.lng()},
    			{lat: p2.lat(), lng: p2.lng()}
		    ],
		    geodesic: true,
		    strokeColor: '#00FF00',
		    strokeOpacity: 1.0,
		    strokeWeight: 2
		  });

		// set it on the map
		line.setMap(map);
		
		// add it to the others
		currentLines.push( line );

	}

}


// UTILITY METHODS

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function randomFromInterval(min,max)
{
    return Math.random()*(max-min)+min;
}
