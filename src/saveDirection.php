<?php

// just a simple PHP script
// if it receives a "payload" in the HTTP request
// id will save it to a random file in the "directions" folder
//
// we will use it to store our Google Directions, so that we can use them later

// check if there is any "payload" in the HTTP request
if(isset($_REQUEST["payload"])){
  
  // if there is one, generate a random file name in the "directions" folder
	$filename = tempnam('./directions/', 'directions_');
	
	// just to make sure, delete it if there is one
	unlink($filename);
	
	// open the file for writing
	$myfile = fopen($filename . ".json" , "w");
	
	// write the "payload" to the file
	// NOTE: DON'T EVER DO THIS!!!!
	// In this way you are allowing anyone to potentially create files in your server
	// potentially creating massive backdoors to your security setup
	// This is just an example, not intended for anything but testing if things work
	fwrite($myfile, $_REQUEST["payload"]);
	
	// close the file
	fclose($myfile);

}

?>
