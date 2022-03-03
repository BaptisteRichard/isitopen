var strings_temp =[];

const defaultLang='en-EN';

const weekday_en = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const weekday_fr = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
strings_temp['weekday'] = [];
strings_temp['weekday']['fr-FR']=weekday_fr;
strings_temp['weekday']['en-EN']=weekday_en;

const weekday_short_en = ["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."]
const weekday_short_fr = ["Dim.","Lun.","Mar.","Mer.","Jeu.","Ven.","Sam."];
strings_temp['weekday_short'] = [];
strings_temp['weekday_short']['fr-FR']=weekday_short_fr;
strings_temp['weekday_short']['en-EN']=weekday_short_en;


strings_temp['str_open_until']=[];
strings_temp['str_open_until']['fr-FR'] = "Ouvert jusqu'à";
strings_temp['str_open_until']['én-EN'] = "Open until";

strings_temp['str_opens']=[];
strings_temp['str_opens']['fr-FR']="Ouvre";
strings_temp['str_opens']['en-EN']="Opens";

strings_temp['str_closed']=[];
strings_temp['str_closed']['fr-FR']="Fermé";
strings_temp['str_closed']['en-EN']="Closed";

strings_temp['str_at']=[];
strings_temp['str_at']['fr-FR']="à";
strings_temp['str_at']['en-EN']="at";

strings_temp['str_tomorrow']=[];
strings_temp['str_tomorrow']['fr-FR']="demain";
strings_temp['str_tomorrow']['en-EN']="tomorrow";

strings_temp['str_cancel']=[];
strings_temp['str_cancel']['fr-FR']="Annuler";
strings_temp['str_cancel']['en-EN']="Cancel";

strings_temp['str_share']=[];
strings_temp['str_share']['fr-FR']="Partager";
strings_temp['str_share']['en-EN']="Share";

strings_temp['str_delete']=[];
strings_temp['str_delete']['fr-FR']="Supprimer";
strings_temp['str_delete']['en-EN']="Delete";

strings_temp['str_copied']=[];
strings_temp['str_copied']['fr-FR']="Copié dans le presse papier";
strings_temp['str_copied']['en-EN']="Copied in clipboard";



const strings = strings_temp;
const lang=navigator.language;


function i18n(str){

	if(strings[str]){

		if(strings[str][lang]){
			return strings[str][lang];
		}else{
			return strings[str][defaultLang];
		}
	}else{
		return str;
	}

}
