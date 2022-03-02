
//const OVERPASS_API = 'https://overpass-api.de/api/interpreter?data=[out:json];'
const OVERPASS_API = 'https://overpass.kumi.systems/api/interpreter?data=[out:json];'
const DEFAULT_MARGIN = 0.00005
const NUMBER_OF_COMPUTED_PATH = 5


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

//default coordinates : fixed to somewhere in Grenoble
var lat = 45.1877535;
var lon = 5.7237598;
//default app version : 0 if app is not used
var appVersion = 0; 

//If we have some coordinates in localstorage , use them instead
if(localStorage.getItem('lat') != null){
  lat=localStorage.getItem('lat');
}
if(localStorage.getItem('lon') != null){
  lon=localStorage.getItem('lon');
}

//If some soordinates were passed in URL, use them instead of anything else
if(urlParams.has('lat')){
  lat=urlParams.get('lat');
}
if(urlParams.has('lon')){
  lon=urlParams.get('lon');
}
if(urlParams.has('app')){
  appVersion=urlParams.get('lon');
}



var map = null;
var valid_button = null;
var markerlist = []
var center_marker = null

var stage=0; // 0 : loading page / 1: target selected / 2 : position selected -- map drawn 

/**
 * @description
 *   Lance la demande de localisation pour la session en cours
 *   Lancée automatiquement avec le onload du body
 * @author Pierre Adam
 */
function initialize() {
	document.getElementById('map').innerHTML = ""

	if (navigator.geolocation) {
		const location_timeout = setTimeout("geolocFail()", 5000);
		const geoOptions = {
			enableHighAccuracy: false,
			maximumAge: 10000,
			timeout: 5000
		};

		navigator.geolocation.getCurrentPosition(position => {
			clearTimeout(location_timeout);
			lat = position.coords.latitude;
			lon = position.coords.longitude;
			showMap(lat, lon);
		}, function (error) {
			clearTimeout(location_timeout);
			geolocFail(2);
		}, geoOptions);
	} else {
		// Fallback for no geolocation
		geolocFail(1);
	}
}


/**
 * @description
 *   Nettoie la carte en supprimant tous les layers sauf les tiles
 *   vide le "cache" de marker
 * @author Pierre Adam
 */
function clear_all_map() {
	map.eachLayer(layer => {
		if (!(layer.hasOwnProperty("_url"))) {
			map.removeLayer(layer);
		}
	});
	valid_button.button.style.display = "none"
//	map.setView([lat_from, lon_from], 17);
	map.setZoom(17);
}

function goBack(){
  if(stage == 0 ) { return; }
  hide_show('menu') ;
  clear_all_map();
  stage --;
}

/**
 * @param {array} currentPos position actuelle du telephone
 * @description
 *   Affiche la carte, crée et ajoute le bouton "retour" et crééele bouton "validation"
 * @author Pierre Adam
 */
function showMap(lat,lon) {
	map = L.map('map').setView([lat,lon], 17);
	L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
		// Il est toujours bien de laisser le lien vers la source des données
		attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a> - icons <a href="/credits.html">credits</a>',
		minZoom: 1,
		maxZoom: 20
	}).addTo(map);

	if(appVersion > 0){ //app should not display back button here as it's embedded in title
		L.easyButton('<img class="back_button" src="images/back.svg" >', (btn, map) => {
			goBack();
		}).addTo(map)
	}

	valid_button = L.easyButton({
			id: 'valid_button',
			states: [{
				onClick: function(btn, map) {
					const lat=map.getCenter().lat
					const lon=map.getCenter().lng
					showPathToNearestTarget(lat,lon,DEFAULT_MARGIN)
					map.removeLayer(center_marker)
					btn.button.style.display = "none"
					},
				icon:'<img class="valid_button" src="images/check.svg" >' 
				}]
	}).addTo(map)
	valid_button.button.style.display = "none"

}

/**
 * @description
 *   Affiche un message d'erreur signifiant que le GPS n'est pas activé.
 * @author Pierre Adam
 */
function geolocFail(code=3) {

	showMap(lat, lon);

	warn = document.getElementById("noGPS");
        warn.style.display="block";
        setTimeout(function(){ 
          warn.classList.add('is-active');
        },1000);


//	document.getElementById("here").style.display = "none";
}

/**
 * @description
 *   Affiche / cache les boutton du menu
 * @author Pierre Adam
 */
function hide_show(id) {
	//document.getElementById('map').innerHTML = ""
	let menu_id = document.getElementById(id);
	if (menu_id.style.display != "none") {
		menu_id.style.display = "none";
	} else {
		menu_id.style.display = "flex";
	}
}


/**
 * @description
 *   Ouvre la carte pour la selection du point de destination et lance le calcul
 *   de la position actuelle vers la destination demandee
 * @author Pierre Adam
 */
async function target_near_pos() {
	hide_show('menu')
	stage =2 ; 
	center_marker = L.marker(map.getCenter()).addTo(map);

	map.on('drag', function (e) {
		center_marker.setLatLng(map.getCenter());
	});
	map.on('zoom', function (e) {
		center_marker.setLatLng(map.getCenter());
	});
	valid_button.button.style.display = ""
}

/**
 * @description
 *   Lance le calcul pour la recherche d'arceaux autour de soi
 * @author Pierre Adam
 */
async function target_near_me() {
	hide_show('menu')
	stage =2 ; 
	await showPathToNearestTarget(lat_from,lon_from, DEFAULT_MARGIN)
}



/**
 * @param {Array} currentPos position actuelle
 * @param {Array} destinationPos position de la destination
 * @param {boolean} isWalking use openRouteService with walk options or not (bike)
 * @description
 *   Calcule le trajet depuis la position courante vers la destination.
 *   Trace au max 5 routes pour y aller.
 * @author Pierre Adam
 */
async function showPathToNearestTarget(lat,lon,margin) {
	localStorage.setItem('lon',lon);
	localStorage.setItem('lat',lat);

  const latMin=parseFloat(lat)-parseFloat(margin);
  const latMax=parseFloat(lat)+parseFloat(margin);
  const lonMin=parseFloat(lon)-parseFloat(margin);
  const lonMax=parseFloat(lon)+parseFloat(margin);

  var position=[lat,lon]

	const overpassUrl = OVERPASS_API + 'node' + '(' + latMin + ',' + lonMin + ',' + latMax + ',' + lonMax + ');out;';
	console.log(overpassUrl);
	const response = await fetch(overpassUrl);
	const osmDataAsJson = await response.json(); // read response body and parse as JSON

	var container = L.DomUtil.create('div'); 
	var popup = L.popup().setContent(container);

	// pas de parking à vélo à 200m à la ronde, ben tant pis !
	if (osmDataAsJson.elements.length == 0) {
		const popupTitle = 'Nothing found';
		L.DomUtil.create('p', '', container).innerHTML= 'No such thing under ? ';
		let marker = L.marker([lat,lon]).addTo(map).bindPopup(popup).openPopup();
		map.setView([lat,lon], 17);
  		return;
	}

	// get the last maxNbOfPark element
	var results = "";
			console.log("Node :"+JSON.stringify(osmDataAsJson.elements));

	for (node of osmDataAsJson.elements) {
		console.log("Node :"+JSON.stringify(node));

		if(node.tags && node.tags.name){
			results += "<a href=\"index.html?addNode="+node.id+"\">"+node.tags.name+"</a><br>";
		}else{
//			results += "<a href=\"index.html?addNode="+node.id+"\">Node "+node.id"</a><br>";
		}
	}
	L.DomUtil.create('p', '', container).innerHTML= results;
	let marker = L.marker([lat,lon]).addTo(map).bindPopup(popup).openPopup();
	map.setView([lat,lon], 17);
 		return;



}
