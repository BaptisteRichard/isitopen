var nodeIds=[];

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


	sanityCheck=/^[NW][0-9]+/i;
	//Sanity check : all elements must be [NW][0-9]+
	nodeIds = nodeIds.filter(function(v){ 
		return v.match(sanityCheck); }
	);

	//If addNode is present, add it to the current list
	if(urlParams.has('addNode') && urlParams.get('addNode').match(sanityCheck)){
		var nodeId = urlParams.get('addNode');
		if (nodeIds.indexOf(nodeId) === -1){
			nodeIds.push(nodeId);
		}
	}

	//If delNode is present, remove it from the current list
	if(urlParams.has('delNode') && urlParams.get('delNode').match(sanityCheck)){
		nodeIds = nodeIds.filter(function(v){ return urlParams.get('delNode') != v ; });
	}

	// Set local Storage to last values
	localStorage.setItem('nodeIds',nodeIds.join(','));

	//clean URL of parameters
	history.replaceState('','7ouvert',window.location.href.split('?')[0]);
}

function exportList(){
 	navigator.clipboard.writeText(window.location.href+"?nodeIds="+nodeIds.join()).then(() => alert(i18n("str_copied"))) ;
  return false;
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
//	nodeIds = nodeIds.map(elem=> 'N'+elem);
	const nominatimUrl = NOMINATIM_API + 'osm_ids='+nodeIds.join()+'';
	console.log(nominatimUrl);
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

function addLinks(){

	var addLink = document.createElement('a');
	addLink.href="addNode.html";
	addLink.innerHTML=i18n('str_add_node');

	var shareLink = document.createElement('a');
	shareLink.onclick=function () { exportList(); return false;};
	shareLink.href="";
	shareLink.innerHTML=i18n('str_share_list');

	var separator = document.createElement('span');
	separator.innerHTML=" | ";

	document.getElementById('links').appendChild(addLink);
	document.getElementById('links').appendChild(separator);
	document.getElementById('links').appendChild(shareLink);
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
	var id=node.osm_id;
	if(node.osm_type == "node" ){ id = "N"+id;}
	if(node.osm_type == "way" ){ id = "W"+id;}

  var name=node.namedetails.name;
  //for specific amenities, add the type name
  if(node.type && node.type == 'post_office' ) { name = i18n('str_post_office')+" "+name ;}


	document.getElementById(id).getElementsByClassName('name')[0].innerHTML = name;

	//Fetch the possible tags for city and remove undefined ones
	var location = [node.address.city,node.address.village,node.address.town,node.address.municipality];
	var city = location.filter(x => x !== undefined);
	if(node.address.road || city[0]){
		document.getElementById(id).getElementsByClassName('address')[0].innerHTML = node.address.road+", "+city[0];
	}
  
	if(!node.extratags.opening_hours) {
		//If we don't have any data on OSM

		document.getElementById(id).getElementsByClassName('nextChange')[0].innerHTML = i18n('str_osm_no_data');
		document.getElementById(id).getElementsByClassName('openingHours')[0].innerHTML = "";
		return ;
	}

	// Language for the warnings (get it from the browser settings).
	let locale = navigator.language;

	// Create opening_hours object.
	let oh = new opening_hours(node.extratags.opening_hours, node, { 'locale': locale });

	// Prettify the value in different languages.
	//let prettifiedValue = oh.prettifyValue({conf: { locale: locale, rule_sep_string: '<br/>' },});
	let prettifiedValue = ohReadable(oh).join("<br/>");

	//Add website information if available
	if(node.extratags.website) { 
		prettifiedValue += '<br><a href="'+node.extratags.website+'" target="_blank">'+i18n('str_visit_website')+'</a>'; 
	}

	var state = oh.getState();
	var nextChange = oh.getNextChange();
	var ncHours = nextChange.getHours();
	var ncMinutes = nextChange.getMinutes();
	var ncDate = nextChange.getDate();
	var ncDay= nextChange.getDay();
	var now = new Date();
	var result = "";

	if(state) {
		document.getElementById(id).classList.remove("closed");
		document.getElementById(id).classList.add("open");
		result += i18n('str_open_until')+" ";
	}else{
		document.getElementById(id).classList.remove("open");
		document.getElementById(id).classList.add("closed");
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

	document.getElementById(id).getElementsByClassName('nextChange')[0].innerHTML =  result;
	document.getElementById(id).getElementsByClassName('openingHours')[0].innerHTML =  prettifiedValue;
}


