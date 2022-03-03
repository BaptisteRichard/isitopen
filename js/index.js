var nodeIds=[];

/*
const weekday_en = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const weekday_fr = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const weekday_short_en = ["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."]
const weekday_short_fr = ["Dim.","Lun.","Mar.","Mer.","Jeu.","Ven.","Sam."];


const weekday = (navigator.language == 'fr-FR' )? weekday_fr : weekday_en ;
const weekday_short = (navigator.language == 'fr-FR' )? weekday_short_fr : weekday_short_en ;
const str_open = (navigator.language == 'fr-FR' )? "Ouvert" : "Open" ;
const str_closed = (navigator.language == 'fr-FR' )? "Fermé" : "Closed" ;
*/

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/lookup?format=json&extratags=1&namedetails=1&';


var nodeList= [];

var menuShow=0;


function loadParams(){
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);


	//If we have some IDs in localstorage , use them instead
	if(localStorage.getItem('nodeIds') != null){
		nodeIds=localStorage.getItem('nodeIds');
	}

	//If some Ids were passed in URL, use them instead of anything else
	if(urlParams.has('nodeIds')){
	nodeIds=urlParams.get('nodeIds');
	}

	// Force ids to be stored in an array
	if(!Array.isArray(nodeIds)){ nodeIds = nodeIds.split(',') ;}

	//convert Ids to numeric
	nodeIds = nodeIds.map(elem=>Number.parseInt(elem,10));

	//exclude anything that was not correctly parsed to numeric
	nodeIds = nodeIds.filter(function(v){ return Number.isInteger(v); });

	//If addNode is present, add it to the current list
	if(urlParams.has('addNode')){
		var nodeId = Number.parseInt(urlParams.get('addNode'));
		if (nodeIds.indexOf(nodeId) === -1){
			nodeIds.push(nodeId);
		}
	}

	//If delNode is present, remove it from the current list
	if(urlParams.has('delNode')){
		nodeIds = nodeIds.filter(function(v){ return Number.parseInt(urlParams.get('delNode')) != v; });
	}

	// Set local Storage to last values
	localStorage.setItem('nodeIds',nodeIds.join(','));

	//clean URL of parameters
	history.replaceState('','7ouvert',window.location.href.split('?')[0]);
}


function showContextualMenu(id){

	menuShow=1;
  elem = document.getElementById(id);

  if(elem.getElementsByClassName('menu')[0].style.display == "block"){
		elem.getElementsByClassName('menu')[0].style.display = "none";
		elem.getElementsByClassName('openingHours')[0].style.display = "none";
		elem.getElementsByClassName('nextChange')[0].style.display = "block";
		elem.getElementsByClassName('address')[0].style.display = "block";
		elem.getElementsByClassName('name')[0].style.display = "block";
	}else{
		elem.getElementsByClassName('menu')[0].style.display = "block";
		elem.getElementsByClassName('openingHours')[0].style.display = "none";
		elem.getElementsByClassName('nextChange')[0].style.display = "none";
		elem.getElementsByClassName('address')[0].style.display = "none";
		elem.getElementsByClassName('name')[0].style.display = "none";
	}

}

function isTomorrow(date){
	var now = new Date();
	var diff = date.getTime() - now.getTime();
	// date is after now, and less than 2 days forward and not the same day as today
	return ( diff > 0 && diff < 172799999 && now.getDate() != date.getDate());
}

function addZero(i) {
	if (i < 10) {i = "0" + i}
	return i;
}

function showHideOH(id){

  elem = document.getElementById(id);

  if(elem.getElementsByClassName('openingHours')[0].style.display == "block"){
		elem.getElementsByClassName('menu')[0].style.display = "none";
		elem.getElementsByClassName('openingHours')[0].style.display = "none";
		elem.getElementsByClassName('nextChange')[0].style.display = "block";
		elem.getElementsByClassName('address')[0].style.display = "block";
		elem.getElementsByClassName('name')[0].style.display = "block";
	}else{
		elem.getElementsByClassName('menu')[0].style.display = "none";
		elem.getElementsByClassName('openingHours')[0].style.display = "block";
		elem.getElementsByClassName('nextChange')[0].style.display = "none";
		elem.getElementsByClassName('address')[0].style.display = "none";
		elem.getElementsByClassName('name')[0].style.display = "none";
	}
}

async function fetchObjects(nodeIds){

	//prefix node IDs with an N for nominatim search
	nodeIds = nodeIds.map(elem=> 'N'+elem);
	const nominatimUrl = NOMINATIM_API + 'osm_ids='+nodeIds.join()+'';
	const response = await fetch(nominatimUrl);
	const osmDataAsJson = await response.json(); // read response body and parse as JSON

	if (osmDataAsJson.length != 0) {
		osmDataAsJson.forEach((node, i) => {
			fillInfo(node);
		});
		nodeList=osmDataAsJson;
	}
	
}

function init(){
	//var nodeIds=[2813031211,1776091479];
	fetchObjects(nodeIds);

	// Refresh state every minute
	var intervalId = window.setInterval(function(){
		nodeList.forEach((node,i) => { fillInfo(node) ; } )
	}, 60000);

	createCanvas(nodeIds);

}

function createCanvas(nodeIds){
	//Create the canvas of nodes
	nodeIds.forEach(id => {

		var pressTimer;
		var div = document.createElement('div');
		div.id = id;
		div.onclick = function (){ showHideOH(id)};
		div.oncontextmenu = function () { showContextualMenu(id); return false; }

		div.ontouchend = function () { if(!menuShow){showHideOH(id)} clearTimeout(pressTimer); menuShow=0; return false; }
		div.ontouchstart = function () { pressTimer=setTimeout(function(){showContextualMenu(id)},500); return false; }

		div.classList.add("item");

		var name = document.createElement('div');
		name.classList.add("name");
		name.innerHTML = "Name (awaiting)";

		var address = document.createElement('div');
		address.classList.add("address");
		address.innerHTML = " ";

		var nextChange = document.createElement('div');
		nextChange.classList.add("nextChange");
		nextChange.innerHTML = "nc (awaiting)";

		var openingHours = document.createElement('div');
		openingHours.classList.add("openingHours");
		openingHours.innerHTML = "oh (awaiting)";

		var menu = document.createElement('div');
		menu.classList.add("menu");

		var shareBtn = document.createElement('div');
 		shareBtn.onclick= function () { navigator.clipboard.writeText(window.location.href+"?addNode="+id).then(() => alert(i18n("str_copied"))) ; return false;};
		shareBtn.innerHTML=i18n('str_share');

		var delBtn = document.createElement('div');
		delBtn.innerHTML="<a href='index.html?delNode="+id+"' >"+i18n('str_delete')+"</a>";

		var cancelBtn = document.createElement('div');
		cancelBtn.innerHTML=i18n("str_cancel");

		menu.appendChild(shareBtn);
		menu.appendChild(delBtn);
		menu.appendChild(cancelBtn);


		div.appendChild(name);
		div.appendChild(address);
		div.appendChild(nextChange);
		div.appendChild(openingHours);
		div.appendChild(menu);

		document.getElementById('content').appendChild(div);
	});
}

/**
* Pretty Prints the given Date's hours and minutes (00h00)
* @arg date : Date Object
**/
function ppHours(date){
	if(date.getMinutes()){
		return date.getHours()+"h"+date.getMinutes();
	}else{
		return date.getHours()+"h";
	}
}


/**
* Give the opening hours of the current week in a human readable format
* @return string representing the opening hours
* @arg oh : OpeningHours object of target node
**/
function ohReadable(oh){

	//Last Monday
	var monday = new Date();
	monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
	monday.setUTCHours(0,0,0,0);
	//Next Sunday
	var sunday = new Date();
	sunday.setDate(sunday.getDate() + (7-sunday.getDay()) % 7);
	sunday.setUTCHours(23,59,59,999);

	//Get openings for the present week
	var intervals = oh.getOpenIntervals(monday,sunday);

	var openings = [[],[],[],[],[],[],[]] ;

	for (var i = 0; i < intervals.length; i++) {

		var from = intervals[i][0];
		var to = intervals[i][1];

		openings[from.getDay()].push(ppHours(from)+"-"+ppHours(to));
	}

	var result = [];

	for (var i = 1; i <= 7; i++) {
		t = i%7;
		var readable = i18n('str_closed');
		if(openings[t].length > 0){
			readable = openings[t].join();
		}
		result.push(i18n('weekday_short')[t]+" : "+readable);
	}

	return result;

}


function fillInfo(node){

	//First fill in the name and address
	document.getElementById(node.osm_id).getElementsByClassName('name')[0].innerHTML = node.namedetails.name;

	//Fetch the possible tags for city and remove undefined ones
	var location = [node.address.city,node.address.village,node.address.town,node.address.municipality];
	var city = location.filter(x => x !== undefined);
	if(node.address.road || city[0]){
		document.getElementById(node.osm_id).getElementsByClassName('address')[0].innerHTML = node.address.road+", "+city[0];
	}
  
	if(!node.extratags.opening_hours) {
		//If we don't have any data on OSM

		document.getElementById(node.osm_id).getElementsByClassName('nextChange')[0].innerHTML = "No data on OSM";
		document.getElementById(node.osm_id).getElementsByClassName('openingHours')[0].innerHTML = "";
		return ;
	}

	// Language for the warnings (get it from the browser settings).
	let locale = navigator.language;

	// Create opening_hours object.
	let oh = new opening_hours(node.extratags.opening_hours, node, { 'locale': locale });

	// Prettify the value in different languages.
	//let prettifiedValue = oh.prettifyValue({conf: { locale: locale, rule_sep_string: '<br/>' },});
	let prettifiedValue = ohReadable(oh).join("<br/>");

	var state = oh.getState();
	var nextChange = oh.getNextChange();
	var ncHours = nextChange.getHours();
	var ncMinutes = nextChange.getMinutes();
	var ncDate = nextChange.getDate();
	var ncDay= nextChange.getDay();
	var now = new Date();
	var result = "";

	if(state) {
		document.getElementById(node.osm_id).classList.remove("closed");
		document.getElementById(node.osm_id).classList.add("open");
		result += i18n('str_open_until')+" ";
	}else{
		document.getElementById(node.osm_id).classList.remove("open");
		document.getElementById(node.osm_id).classList.add("closed");
		result += i18n('str_opens')+" ";
	}


//	result += "jusqu'"
	if (now.getDate() == ncDate) {
		// Only display hour of the nextChange if it is today
		result += i18n('str_at')+" "+addZero(ncHours)+"h"+addZero(ncMinutes);
	}else{
		if(isTomorrow(nextChange)){
			result += i18n('str_tomorrow'); 
		}else{
			result += i18n('weekday')[ncDay];
		}
		result += " "+i18n('str_at')+" "+addZero(ncHours)+"h"+addZero(ncMinutes);
	}

	document.getElementById(node.osm_id).getElementsByClassName('nextChange')[0].innerHTML =  result;
	document.getElementById(node.osm_id).getElementsByClassName('openingHours')[0].innerHTML =  prettifiedValue;
}


