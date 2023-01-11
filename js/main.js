const jquery = require('jquery');
$ = window.$ = window.jQuery = jquery;

//var endpoint = 'https://cloud.greentw.greenpeace.org/websign-dummy';
//var endpoint = 'https://cors-anywhere.small-service.gpeastasia.org/https://cloud.greentw.greenpeace.org/websign-dummy';
var endpoint = 'https://cloud.greentw.greenpeace.org/websign';
//var apiUrl = 'https://script.google.com/macros/s/AKfycbxv51TSdarVToqYywWgSjOpz0wy4ml1HYh4WkMgv5uNRHlVtzZikO0wJu5ZpVZ3bjPp/exec';//dummy
var apiUrl = '';
var googleSheetUrl = '';
var contentUrl = '';
var successful_list = [];
var failed_list = [];
var icsString = `BEGIN:VCALENDAR
PRODID:-//Greenpeace 綠色和平//Webinar Calendar 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-TIMEZONE:Asia/Taipei
BEGIN:VTIMEZONE
TZID:Asia/Taipei
X-LIC-LOCATION:Asia/Taipei
BEGIN:STANDARD
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:CST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE`;

/**
 * in regResult(), if all the registed sessions have returned from API
 * then display the reulst in the Thank You Page
 * 
 * @param {*} curr_ind: current index of checkedSessions
 * @param {*} sessionSize: number of checked sessions
 */
function regResult(curr_ind, sessionSize) {
  // console.log("regResult - curr_ind:", curr_ind);
  // console.log("regResult - sessionSize:", sessionSize);
  if (curr_ind === sessionSize) {                      
    let result_str = "";    
    
    if (successful_list.length > 0) {                
      successful_list.sort();
      result_str = "<p>您成功報名了：</p>";
      successful_list.forEach(item => {
        result_str += "<li>" + item + "</li>";
      });
    }

    if (failed_list.length > 0) {
      failed_list.sort();
      result_str += "<p>報名以下場次失敗了：</p>";
      successful_list.forEach(item => {
        result_str += item + "<br>";
      });                  
    }

    $(".thank-you-div .result").html(result_str);
    $(".thank-you-div .content").html($(".thank-you-div .content").html());
    let resultDiv = document.querySelector(".thank-you-div .result");
    let icsBtn = document.querySelector(".downloadICS_btn");
    resultDiv.insertBefore(icsBtn, resultDiv.lastElementChild.nextSibling)
    //tyDiv.insertBefore(icsBtn, tyDiv.nextSibling);
    //$(".downloadICS_btn").after($(".thank-you-div .content"));
    
    //showFullPageMessage(result_str, "#000", "#fff", true);
    $(".form-div").hide();                      
    $(".thank-you-div").show();
    window.scrollTo(0, 0);
    hideFullPageLoading();    
  }  
}

/**
 *  Submit one session at a time
 */
function submitPage(formData, checkedSessions, labelSessions, curr_ind) {
  formData.set('CampaignId', checkedSessions[curr_ind].value);
  formData.set('EndDate', document.querySelector(`#endDate${labelSessions[curr_ind]}`).value);  
  formData.set('Session', document.querySelector(`#fullName-session${labelSessions[curr_ind]}`).value);    
  //console.log(document.querySelector(`#fullName-session${labelSessions[curr_ind]}`).value);

  return fetch(endpoint, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(response => {    
    if (response) {              										                
      if (response.Supporter) {              
        // add tracking code here        
        // window.dataLayer = window.dataLayer || [];
        // window.dataLayer.push({
        //     'event': 'gaEvent',
        //     'eventCategory': 'webinars',
        //     'eventAction': 'signup',
        //     'eventLabel': 'DD webinar'
        // });3

        let sessionSize = document.querySelectorAll('input[name="sessions[]"]:checked').length - 1; 
        let sessionName = document.getElementById(`fullName-session${labelSessions[curr_ind]}`).value;            
        successful_list.push(sessionName);                    
        regResult(curr_ind, sessionSize);

        // add VEVENT of ics
        let hour = new Date().getHours();//小時
        if (hour < 10) hour = '0' + hour;
        let minute = new Date().getMinutes();//分鐘
        if (minute < 10) minute = '0' + minute;
        let second = new Date().getSeconds();//秒
        if (second < 10) second = '0' + second;
        let DTSTAMP = new Date().toISOString().slice(0, 11).toString().replaceAll("-","") + hour + minute + second + 'Z';

        let DTSTART = document.querySelector(`#DTSTART${labelSessions[curr_ind]}`).value.trim().replaceAll("-","").replaceAll(" ","T").replaceAll(":","") + "00Z";
        let DTEND = document.querySelector(`#DTEND${labelSessions[curr_ind]}`).value.trim().replaceAll("-","").replaceAll(" ","T").replaceAll(":","") + "00Z";
        let LOCATION = document.querySelector(`#LOCATION${labelSessions[curr_ind]}`).value;
        let EMAIL = document.getElementById("Email").value;

        const uid = () => {
          return Date.now().toString(36) + Math.random().toString(36).substr(2) + "-" + EMAIL;
        };
        let uidVar = uid();
        
        icsString += `\nBEGIN:VEVENT\nDTSTART;TZID=Asia/Taipei:${DTSTART}\nDTEND;TZID=Asia/Taipei:${DTEND}\nDTSTAMP:${DTSTAMP}\nORGANIZER;CN=綠色和平:MAILTO:donor.services.tw@greenpeace.org\nUID:${uidVar}\nATTENDEE:mailto:${EMAIL}\nLOCATION:${LOCATION}\nSUMMARY:${sessionName}\nEND:VEVENT`;

        console.log('icsString:', icsString);

        //console.log(formData);
        fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
      }
    }
    //hideFullPageLoading();    
  })      
  .catch(error => {          
    console.log("fetch error");
    console.error(error);
    
    failed_list.push(document.getElementById(`fullName-session${index}`).value);    
    regResult(curr_ind, sessionSize);    
  })
}

/**
 * 
 * @param {*} formData: collection of form fileds
 * @param {*} checkedSessions: collection of user checked sessions 
 * @param {*} labelSessions: collection of checkedSessions indexes
 * @param {*} curr_ind: current index of checkedSessions
 * @returns 
 */
 
function runSerial(formData, checkedSessions, labelSessions, curr_ind) {
  var result = Promise.resolve();  
  checkedSessions.forEach(checkedSession => {        
    result = result.then(() => submitPage(formData, checkedSessions, labelSessions, curr_ind++));
  });
  return result;
}

/**
 * http://techslides.com/convert-csv-to-json-in-javascript
 * 
 * @param  {text}
 * @return {Array}
 */
function csvJSON(csv){
  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(",").map(Function.prototype.call, String.prototype.trim);

  for(var i=1;i<lines.length;i++){
    var obj = {};
    var currentline=lines[i].split(",");

    for(var j=0;j<headers.length;j++){
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return result; //JavaScript object
  // return JSON.stringify(result); //JSON
}


// collect Form Values
var collectFormValues = () => {
  let dict = {}

  // collect url params
  let searchParams = new URL(window.location.href).searchParams;
  let urlParams2CRMFields = {
    utm_medium: 'UtmMedium',
    utm_source: 'UtmSource',
    utm_campaign: 'UtmCampaign',
    utm_content: 'UtmContent',
    utm_term: 'UtmTerm'
  }
  searchParams.forEach((v, k) => {
    if (k in urlParams2CRMFields) {
      dict[urlParams2CRMFields[k]] = v
    } else {
      dict[k] = v
    }
  });

  // read in the form values
  document.querySelectorAll("#mc-form input,select").forEach(function (el, idx) {
    if (el.type==="checkbox") {
      dict[el.name] = el.checked
    } else {
      dict[el.name] = el.value
    }
  })

  // add extra fields  
  dict['CampaignData1__c'] = document.querySelector('[name=gender]:checked').value;
  //dict['CampaignData2__c'] = sessions.join(',');  
  dict['Completion_URL__c'] = window.location.href;

  // wrap into FormData
  var formData = new FormData();
  for (var k in dict) {
    //console.log(k, dict[k])
    formData.append(k, dict[k]);
  }

  return formData
}

// Form validation
const formValidate = () => {    
  require('jquery-validation');  

	$.validator.addMethod(
    'email',
    function(value, element){
      return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i.test(value);
    },
    'Email 格式錯誤'
  );

  $.validator.addMethod(
    'taiwan-phone',
    function (value, element) {
      const phoneReg6 = new RegExp(/^(0|886|\+886)?(9\d{8})$/).test(value);
      const phoneReg7 = new RegExp(/^(0|886|\+886){1}[3-8]-?\d{6,8}$/).test(value);
      const phoneReg8 = new RegExp(/^(0|886|\+886){1}[2]-?\d{8}$/).test(value);
    
      if ($('#MobilePhone').prop('required')) {
        //console.log('phone miss');
        return this.optional(element) || phoneReg6 || phoneReg7 || phoneReg8;
      } else if ($('#MobilePhone').val()) {
        return this.optional(element) || phoneReg6 || phoneReg7 || phoneReg8;
      }
      return true;
    },
    "電話格式不正確，請輸入格式 0912345678 或 02-12345678"
  );

  $.validator.addClassRules({ // connect it to a css class
    "email": {email: true},
    "taiwan-phone" : { "taiwan-phone" : true }
  });  

  $.extend($.validator.messages, {
    required: "必填欄位"
  });
  
  $("#mc-form").validate({           
    //debug: true,
    rules: {
      "sessions[]": {
        required: true,
        minlength: 1
      }
    },
  	groups: {
     'session-group': "sessions[]"
  	},
  	messages: {
			'session-group': {
				required: '此欄必填'
			}
		},
	  errorPlacement: function(error, element) {
		    if(element.attr("name") == "sessions[]") {
		    	error.insertAfter(".webinar__label");
		    } else {
		      error.insertAfter(element);
		    }
		},
    submitHandler: function() {
      showFullPageLoading();

      if (!checkAdditionalForm()) {
        hideFullPageLoading();
        return;
      }

      var formData = collectFormValues();              
      //console.log(formData);
      //var hasFailed = false
      let checkedSessions = document.querySelectorAll('input[name="sessions[]"]:checked');            
      let labelSessions = [];
      //let endDates = [];

      document.querySelectorAll('input[name="sessions[]"]:checked').forEach(function(el, index) {        
        labelSessions.push(el.id.substr(el.id.indexOf('session') + 7));
        //endDates.push(document.querySelector(`#endDate${index}`).value);
      });    
      
      runSerial(formData, checkedSessions, labelSessions, 0);            
    }
  });
}

/*
 * checkAdditionalForm
*/
function checkAdditionalForm() {  
  const additionalForms = document.querySelectorAll('.visible__additional__form');
  let flag = true;
  additionalForms.forEach(function(aForm){
    
    if(aForm.querySelector('#LastName').value.trim() == "") {
      aForm.querySelector('.LastName__error').style.display = 'block';
      flag = false;
    }

    if(aForm.querySelector('#FirstName').value.trim() == "") {      
      aForm.querySelector('.FirstName__error').style.display = 'block';
      flag = false;
    }

    if(aForm.querySelector('#Email').value.trim() == "") {
      aForm.querySelector('.Email__error').style.display = 'block';
      aForm.querySelector('.Email__error').innerHTML = '此欄必填';
      flag = false;
    } else {
      flag = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i.test(aForm.querySelector('#Email').value);
      if (!flag) {
        aForm.querySelector('.Email__error').innerHTML = '格式錯誤';
        aForm.querySelector('.Email__error').style.display = 'block';
      }
    }

    if(aForm.querySelector('#MobilePhone').value.trim() == "") {
      aForm.querySelector('.MobilePhone__error').style.display = 'block';
      aForm.querySelector('.MobilePhone__error').innerHTML = '此欄必填';
      flag = false;
    } else {
      const phoneReg6 = new RegExp(/^(0|886|\+886)?(9\d{8})$/).test(aForm.querySelector('#MobilePhone').value);
      const phoneReg7 = new RegExp(/^(0|886|\+886){1}[3-8]-?\d{6,8}$/).test(aForm.querySelector('#MobilePhone').value);
      const phoneReg8 = new RegExp(/^(0|886|\+886){1}[2]-?\d{8}$/).test(aForm.querySelector('#MobilePhone').value);
      flag = phoneReg6 || phoneReg7 || phoneReg8;
      if (!flag) {
        aForm.querySelector('.MobilePhone__error').innerHTML = '格式錯誤，請輸入格式 0912345678 或 02-12345678';
        aForm.querySelector('.MobilePhone__error').style.display = 'block';
      }
    }

    if(aForm.querySelector('#Birthdate').value.trim() == "") {      
      aForm.querySelector('.Birthdate__error').style.display = 'block';
      flag = false;
    }
  
  });
  
  return flag;
}

/*
 * Mailcheck
 */
let domains = [
	"me.com",
	"outlook.com",
	"netvigator.com",
	"cloud.com",
	"live.hk",
	"msn.com",
	"gmail.com",
	"hotmail.com",
	"ymail.com",
	"yahoo.com",
	"yahoo.com.tw",
	"yahoo.com.hk"
];
let topLevelDomains = ["com", "net", "org"];
let email = document.getElementById("Email");

var Mailcheck = require('mailcheck');
email.onblur = function(){
  //console.log('blur');
	if (!document.getElementById("email-suggestion")) {
		Mailcheck.run({
			email: email.value,
			domains: domains,                       // optional
			topLevelDomains: topLevelDomains,       // optional
			suggested: function(suggestion) {		
				email.insertAdjacentHTML('afterend', `<div id="email-suggestion" style="font-size:small; color:blue; line-height:2rem;">您想輸入的是 <strong id="emailSuggestion">${suggestion.full}</strong> 嗎？</div>`);
				
				document.getElementById("email-suggestion").onclick = function() {
					email.value = document.getElementById("emailSuggestion").innerText;
					document.getElementById("email-suggestion").remove();					
				};
			},
			empty: function() {
				this.emailSuggestion = null;
			}
		});
	}
}

/**
 * This is a full page loading animation	 
 */
const showFullPageLoading = (msg) => {
  if ( !document.querySelector("#page-loading")) {
    if (msg) {
      document.querySelector("body").insertAdjacentHTML('beforeend', `
        <div id="page-loading" class="hide">
          <div class="msg-box">
            <img src="https://change.greenpeace.org.tw/others/gp-logo-green-2019.png" />
          </div>
        </div>`);
    } else {
      document.querySelector("body").insertAdjacentHTML('beforeend', `
        <div id="page-loading" class="hide">
          <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>`);
    }
  }

  setTimeout(() => { // to enable the transition
    document.querySelector("#page-loading").classList.remove("hide")
  }, 0)
}
/**
 * Hide the full page loading
 */
const hideFullPageLoading = () => {
  document.querySelector("#page-loading").classList.add("hide")

  setTimeout(() => {
    if (document.querySelector("#page-loading")) 
      document.querySelector("#page-loading").remove()
  }, 1100)
}
/**
 * This is a full page message for DD fundraiserId
   */
 const showFullPageMessage = (msg, color, bgcolor, showBtn) => {
  if ( !document.querySelector("#page-message")) {
    var btn = "";
    if (showBtn) {
      btn = `<div><button onclick="$('#page-message').hide();">OK</botton></div>`;
    }

    document.querySelector("body").insertAdjacentHTML('beforeend', `
      <div id="page-message" class="hide">
        <div class="msg-box" style="color:${color}; background-color:${bgcolor}">
          <p>${msg}</p>
          ${btn}
        </div>
      </div>`);
  }

  setTimeout(() => { // to enable the transition
    document.querySelector("#page-message").classList.remove("hide")
  }, 0)
}
/**
 * Hide the full page message
 */
 const hideFullPageMessage = () => {
  document.querySelector("#page-message").classList.add("hide")

  setTimeout(() => {
    document.querySelector("#page-message").remove()
  }, 1100)
}

/**
 * Set the target of DD webinar: donor / supporter / retention
 */
const setTarget = () => {
  let urlParams = new URLSearchParams(window.location.search);
  let type = urlParams.get('type');

  //set url of app script for sign-up log
  if (type === "donor") {
    //apiUrl = 'https://script.google.com/macros/s/AKfycbw-tVU4LaVVlq4OLYVcIgw6CTldyxNxlzKypAGfiwgNTROvITI3x_USGcVt09bj4-qUgA/exec';
    apiUrl = 'https://script.google.com/macros/s/AKfycbw0JJqLb8SIwxLdQXeMBLoV46_wEz2joGjtnlVFli45ANtAJAIJ1ieRp4KBKg8ykmtGcA/exec';
    contentUrl = 'https://docs.google.com/spreadsheets/u/0/d/1m4Ys7KGajCNjLXkZYK1Ct1EiI2hRyoX1vO35JGECh8Q/export?format=csv&id=1m4Ys7KGajCNjLXkZYK1Ct1EiI2hRyoX1vO35JGECh8Q&gid=1562944622';
    googleSheetUrl = 'https://docs.google.com/spreadsheets/u/0/d/1m4Ys7KGajCNjLXkZYK1Ct1EiI2hRyoX1vO35JGECh8Q/export?format=csv&id=1m4Ys7KGajCNjLXkZYK1Ct1EiI2hRyoX1vO35JGECh8Q&gid=0';
    $('.gender__div').hide();
  } else if (type === "supporter") {
    //apiUrl = 'https://script.google.com/macros/s/AKfycbwl2OACweJFklrhOlWT_Do9n68b6DLWcpPBAYDEqGfab9nJqLUJmv7QRz9FoyGl5MFw/exec';
    apiUrl = 'https://script.google.com/macros/s/AKfycbwnJzTYrGz9rVq9TwQbddGBVdRkuOWlt7JdSmFrv7WR-QeLGwsELlkIUFiwCwrDDn6D/exec';    
    contentUrl = 'https://docs.google.com/spreadsheets/u/0/d/1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ/export?format=csv&id=1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ&gid=1562944622';
    googleSheetUrl = 'https://docs.google.com/spreadsheets/u/0/d/1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ/export?format=csv&id=1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ&gid=0';
  } else if (type === "retention") {
    //apiUrl = 'https://gsheet-toolkit.small-service.gpeastasia.org/v1/db/tw-dd_webinar-donor_retension';
    apiUrl = 'https://script.google.com/macros/s/AKfycbysg-72lpq29C1hMsaDniwiylOUKCuzUlRq8w5-kKli4ggI4_eYGHYdNOpI5vTorzR6/exec';
    contentUrl = 'https://docs.google.com/spreadsheets/u/0/d/1V0c57qqhw28IXHkODvN9apqOG359N1YZdrtH_7_BkEM/export?format=csv&id=1V0c57qqhw28IXHkODvN9apqOG359N1YZdrtH_7_BkEM&gid=1562944622';
    googleSheetUrl = 'https://docs.google.com/spreadsheets/u/0/d/1V0c57qqhw28IXHkODvN9apqOG359N1YZdrtH_7_BkEM/export?format=csv&id=1V0c57qqhw28IXHkODvN9apqOG359N1YZdrtH_7_BkEM&gid=0';
    $('.gender__div').hide();
  } else {
    showFullPageMessage("請確認報名網址", "#fff", "#66cc00", false);
  }
}

/**
 * swap the images in img-div when scrolling
 */
const moniterScroll = () => {
  if ($(window).width() <= 800) {
    return;
  }

  $.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

//   let currentMonth = new Date().getMonth() + 1;
//   if (currentMonth > 12)
//     currentMonth = 1;

//   let nextMonth = currentMonth + 1;
//   if (nextMonth > 12)
//     nextMonth = 1;  
  
//   $('#month-' + nextMonth).hide();

//   $(window).on('scroll', function() {
//     if ($('.' + currentMonth.toString()).length && $('.' + nextMonth.toString()).length
//         && $('#month-' + currentMonth).length && $('#month-' + nextMonth).length) {
//       if ($('.' + currentMonth.toString()).isInViewport()) {      
//         $('#month-' + currentMonth).fadeIn(1000);
//         $('#month-' + nextMonth).hide();
//         //console.log(currentMonth, ' in viewport');  
//         /*        
//         if ($('#month-' + currentMonth).prev().length
//           && $('#month-' + currentMonth).prev()[0].id== 'month-' + nextMonth) {          
//           $('#month-' + currentMonth).insertBefore('#month-' + nextMonth);                      
//         }      
//         $('#month-' + currentMonth).css('position', 'sticky');
//         $('#month-' + nextMonth).css('position', 'relative');*/
//       } else if ($('.' + nextMonth.toString()).isInViewport()) {  
//         $('#month-' + nextMonth).fadeIn(1000);
//         $('#month-' + currentMonth).hide();    
//         //console.log(nextMonth, ' in viewport');
//         /*
//         $('#month-' + nextMonth).insertBefore('#month-' + currentMonth);  
//         $('#month-' + nextMonth).css('position', 'sticky');
//         $('#month-' + currentMonth).css('position', 'relative');*/
//       } else {
//         //console.log('not in viewport');
//       } 
//     }        
//   });
}

/**
 * main thread
 */
document.addEventListener("DOMContentLoaded", function(event) { 
  showFullPageLoading(true);

  // Set the target of DD webinar
  setTarget();

  moniterScroll();

  // monitor the status of OptIn
  const OptIn = document.getElementById('OptIn')

  OptIn.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      document.querySelector('#OptIn-error').style.display = "none";
      document.querySelector('#submit_btn').disabled = false;
    } else {
      document.querySelector('#OptIn-error').innerHTML = '此部分未打勾將無法收到活動連結通知信，故無法參加活動唷！';
      document.querySelector('#OptIn-error').style.display = "block";
      document.querySelector('#submit_btn').disabled = true;
    }
  })

  // create the year options
	let currYear = new Date().getFullYear();
  let obj = document.getElementById('Birthdate');
  for (var i = 0; i < 100; i++) {
    //let option = `<option value="${currYear-i}-01-01">${currYear-i}</option>`;    
    obj.add(new Option(currYear-i, `${currYear-i}-01-01`));
  }
  //obj.selectedIndex = 21;

  var events = []

  /**
   * Populate the events data to the checkbox elements
   * @param  {[{"CampaignId":string, "Event Display Name":string, "Max Signups":number}]}
   */
  const populateEventSelections = (events) => {
    let offlineDOM = document.querySelector(".offline-sessions");
    let sessionDOM = document.querySelector(".webinar-sessions");
    //let selectDOM = document.querySelector(".select-sessions");//
    if ( !sessionDOM || !offlineDOM) {
      throw "Cannot find the webinar-sessions DOM."
    }
    
    //offlineDOM.innerHTML = `<legend class='offline'>高雄實體活動</legend><label class='offline-address'>高雄市三民區平等路45號1樓 <a href='https://goo.gl/maps/W6cGJF1BbwZe3uA69' target='_blank'><img style='width:20px;' src='https://change.greenpeace.org.tw/2021/webinar/DD-webinar-portal/images/road-map-fill-pngrepo-com.png'></a>（<a href='https://docs.google.com/document/d/1Hw9IG3I8LkVB1d9i_MvJ43BdKght5_gI82_uQaacZuc/edit?usp=sharing' target='_blank'>交通方式</a>）</label><div style='color:red; position:relative;'>【實體活動空間有限，每場名額上限為28人，每人最多僅能攜伴一位親友參加】</div>`; // clear loading content
    offlineDOM.innerHTML = `<legend class='offline'>實體活動</legend><div style='color:red; position:relative;'></div>`; // clear loading content
    sessionDOM.innerHTML = `<legend class='online'>線上活動</legend>`; // clear loading content    

    let topics = [];
    let topicSessions = [];
    let newTopicIndex = 0

    // populate the events to the select element        
    events.forEach((row, k) => {
      if (row["Event Display Name"] == "undefined" || !row["Event Display Name"]) {
        return;
      }      
      
      // creating the session / topic
      // creating hidden input for EndDate
      let endDate = document.createElement('input');
      endDate.type = "hidden";
      endDate.id = `endDate${k}`;
      endDate.value = row["From DateTime"].substr(0, 10).trim().replace(/\//g, "-");

      let DTSTART = document.createElement('input');
      DTSTART.type = "hidden";
      DTSTART.id = `DTSTART${k}`;
      DTSTART.value = row["From DateTime"].trim().replace(/\//g, "-");

      let DTEND = document.createElement('input');
      DTEND.type = "hidden";
      DTEND.id = `DTEND${k}`;
      DTEND.value = endDate.value + " " + row["Session"].substr(row["Session"].indexOf('-') + 1).trim();
 
      let LOCATION = document.createElement('input');
      LOCATION.type = "hidden";
      LOCATION.id = `LOCATION${k}`;      
      if (row["Offline"] === "TRUE") {
        LOCATION.value = "綠色和平臺北辦公室";       
      } else {
        LOCATION.value = "ZOOM";
      }

      // creating checkbox element
      let checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.id = `session${k}`;
      checkbox.name = `sessions[]`;
      checkbox.className = `session-group`;
      checkbox.value = row["CampaignId"];
      //checkbox.required = true;      

      // creating label for checkbox
      let label = document.createElement('label');
      label.htmlFor = `session${k}`;
      label.id = `label-session${k}`;
      label.appendChild(document.createTextNode(`${row["Session"]}`));      
      
      // for display
      // let topicBgColor = '#edf9d1';
      // if (newTopicIndex % 2) {
      //   topicBgColor = '#ffffff';
      // }

      if (topics.includes(row["Event Display Name"])) { //If the topic already exists, get it's index of topics[]
        let topicIndex = topics.indexOf(row["Event Display Name"]);        

        // add the non-first session
        // get the container, and appending the checkbox and label to it     
        let fullNameInput = document.createElement('input');
        fullNameInput.type = 'hidden';        
        fullNameInput.id = `fullName-session${k}`;
        fullNameInput.value = `${row["Session"]} ${row["Event Display Name"]}`;

        let sessionDiv = topicSessions[topicIndex];
        //sessionDiv.className = "form__session";
        sessionDiv.appendChild(checkbox);
        sessionDiv.appendChild(label);
        sessionDiv.appendChild(endDate);
        sessionDiv.appendChild(DTSTART);
        sessionDiv.appendChild(DTEND);
        sessionDiv.appendChild(LOCATION);
        sessionDiv.appendChild(fullNameInput);
        sessionDiv.id = `container${topicIndex}`;     
        
        // finding the exist topic container, add session into it
        let topicContainerDiv = document.getElementById(`topicContainer${topicIndex}`);         
        topicContainerDiv.appendChild(sessionDiv);

      } else { // if it is a new topic, insert into topics[]         
        // creating label for this Event Display Name
        // creating div as container
        let topicDiv = document.createElement('div');   
        let fromDT = new Date(row["From DateTime"]);          
        topicDiv.className = "form__topic " + (fromDT.getMonth() + 1).toString();
        let topicLabel = document.createElement('div');        
        //topicLabel.appendChild(document.createTextNode(`${row["Event Display Name"]}`));
        topicLabel.innerHTML = `${row["Event Display Name"]}`;
        topicLabel.className = "topic__session";
        let descLabel = document.createElement('div');                
        //descLabel.innerHTML = `${row["Description"]}`;
        descLabel.className = "label__session";
        descLabel.id = `desc${newTopicIndex}`;                
        if (row["Description"] != "undefined" && row["Description"].trim() != "") {                 
          //fetch('https://change.greenpeace.org.tw/2021/webinar/DD-webinar-donor/files/12_04-desc.html')
          fetch(`${row["Description"]}`)
            .then(response => response.text())
            .then(data => {          
              //console.log(data);
              document.querySelector('#' + descLabel.id).innerHTML = data;
          });
        }        
        topicDiv.appendChild(topicLabel);   
        topicDiv.appendChild(descLabel);              
        //topicDiv.style.backgroundColor = topicBgColor;
        topicDiv.id = `topic${newTopicIndex}`;

        // add the first session        
        // creating div as container, and appending the checkbox and label to it        
        let fullNameInput = document.createElement('input');
        fullNameInput.type = 'hidden';        
        fullNameInput.id = `fullName-session${k}`;
        fullNameInput.value = `${row["Session"]} ${row["Event Display Name"]}`;

        let sessionDiv = document.createElement('div');      
        sessionDiv.className = "form__session";
        sessionDiv.appendChild(checkbox);
        sessionDiv.appendChild(label);
        sessionDiv.appendChild(endDate);
        sessionDiv.appendChild(DTSTART);
        sessionDiv.appendChild(DTEND);
        sessionDiv.appendChild(LOCATION);
        sessionDiv.appendChild(fullNameInput);
        sessionDiv.id = `container${newTopicIndex}`;
        //sessionDiv.style.backgroundColor = topicBgColor;    
        
        // creating a topic container, add topic / session into it, type of are div
        let topicContainerDiv = document.createElement('div');         
        topicContainerDiv.appendChild(topicDiv);
        topicContainerDiv.appendChild(sessionDiv);
        topicContainerDiv.id = `topicContainer${newTopicIndex}`;
        topicContainerDiv.className = `topicContainer`;
        //topicContainerDiv.style.backgroundColor = topicBgColor;

        // add sessionDiv to topicSessions[], typeOf is div
        topicSessions.push(sessionDiv);

        // add Event Display Name to topics[], typeOf is string
        topics.push(row["Event Display Name"]);        
        newTopicIndex++;    
        
        if (row["Offline"] === "TRUE") {
          offlineDOM.appendChild(topicContainerDiv);
          //console.log(row["Event Display Name"], " add to Offline");
        } else {
          sessionDOM.appendChild(topicContainerDiv);
          //console.log(row["Event Display Name"], " add to Online");
        }
      }      

      // disable the checkbox of full session
      if (row["Max Signups"] == 0 || !row["CampaignId"]) {        
        document.getElementById(`session${k}`).disabled = true;
        label.className = "session-disabled";
      }
      if (row["is-full"]) {        
        document.getElementById(`session${k}`).disabled = true;
        label.className = "session-disabled";        
        label.innerHTML += `<span class="label__session-full">已額滿</span>`;
      }
      
      // disable the checkbox of not open session      
      if (row["Open"] == "未開放") {                
        document.getElementById(`session${k}`).disabled = true;        
        label.className = "session-disabled";
        label.innerHTML += `<span class="label__session-unopened">未開放</span>`;
      } else if (row["Open"] == "已結束") {        
        document.getElementById(`session${k}`).disabled = true;        
        label.className = "session-disabled";
        label.innerHTML += `<span class="label__session-closed">已結束</span>`;
      }
    });

    if (document.querySelector(".offline-sessions").childElementCount === 3) {
      document.querySelector(".offline-sessions").style.display = "none";
    }
    if (document.querySelector(".webinar-sessions").childElementCount === 1) {
      document.querySelector(".webinar-sessions").style.display = "none";
    }
  }

  // fetch content / image
  fetch(contentUrl)
    .then(response => response.text())
    .then(response => {
      var lines = response.split("\n");
      //var result = [];
      //var headers=lines[0].split(",").map(Function.prototype.call, String.prototype.trim);

      for(var i=0;i<lines.length;i++){        
        var currentline=lines[i].split(",");        
        //console.log(currentline[0]);        

        if (currentline[0].toLowerCase().indexOf("image") >= 0) {
          //document.getElementsByClassName("img-div")[0].style.backgroundImage = `url(${currentline[1].trim()})`;     
          //let imgUrl = `https://cors-anywhere.small-service.gpeastasia.org/${currentline[1].trim()}`;
          //let imgUrl = `${currentline[1].trim()}`;
          //document.getElementsByClassName("img-div")[0].innerHTML = `<img src='${imgUrl}' style='width:100%;' id='main-img' />`;          
          document.getElementsByClassName("img-div")[0].innerHTML = `${currentline[1].trim()}`;
        } else if (currentline[0].toLowerCase().indexOf("title") >= 0) { 
          document.title = currentline[1].trim() + "｜綠色和平";
          document.getElementsByClassName("title")[0].innerHTML = currentline[1].trim();
          document.getElementsByClassName("title")[1].innerHTML = currentline[1].trim();
        } else if (currentline[0].toLowerCase().indexOf("content top") >= 0) {
          document.getElementsByClassName("content-top")[0].innerHTML = currentline[1].trim();
        } else if (currentline[0].toLowerCase().indexOf("content bottom") >= 0) {
          document.getElementsByClassName("content-bottom")[0].innerHTML = currentline[1].trim();
        } else if (currentline[0].toLowerCase().indexOf("thank you message") >= 0) {
          document.getElementsByClassName("content")[0].innerHTML = currentline[1].trim();          
        } else if (currentline[0].toLowerCase().indexOf("share preview") >= 0) {
          $('meta[property=og\\:image]').attr('content', currentline[1].trim());
        }

      }
    });

  // step 1: fetch events from gsheet
  // See howto use gsheet as DB
  //fetch("https://docs.google.com/spreadsheets/u/0/d/1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ/export?format=csv&id=1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ&gid=0")
  fetch(googleSheetUrl)
    .then(response => response.text())
    .then(response => csvJSON(response))
    .then(response => { // replace the event context      
      //console.log('response', response)
      events = response
      populateEventSelections(events)
      return response
    })

    // step 2: fetch the signup numbers
    .then(response => {
      let campaignIds = response.map(row => row["CampaignId"])
      //console.log('campaignIds', campaignIds)
      return fetch("https://cloud.greentw.greenpeace.org/campaign-member-counts?campaignIds="+campaignIds.join(","))
    })
    .then(response => response.json())
    .then(response => {      
      let rows = response;
      
      rows.forEach(serverRow => {
        let campaignId = serverRow["Id"]
        
        // find that campaign
        let idx = events.findIndex(e => e.CampaignId===campaignId);
        if (idx > -1) {
          let numRes = parseInt(serverRow["NumberOfResponses"], 10);
          let targetSignups = parseInt(events[idx]["Max Signups"], 10);
          
          if (numRes >= targetSignups) {            
            events[idx]["is-full"] = true;
          }          
        }
      });
      populateEventSelections(events) // update the display names

      hideFullPageLoading();
    });

  formValidate();
  //console.log('publicPath:', babelConfig.publicPath);

  document.querySelector('.downloadICS_btn').onclick = function() {
    icsString += `\nEND:VCALENDAR`;
    window.open("data:text/calendar;charset=utf8," + encodeURIComponent(icsString));
  };


  // document.querySelector('.additional_btn').onclick = function() {
  //   let cln = document.querySelector('.additional__form').cloneNode(true);
  //   cln.style.display = 'block';
  //   cln.classList.add("visible__additional__form");
  //   const additional_btn = cln.querySelector('.close__additional__form');
  //   additional_btn.addEventListener('click', function() {      
  //     additional_btn.parentElement.parentElement.style.display = 'none';     
  //   });
  //   document.querySelector('.additional__form_groups').appendChild(cln);    
  // };

});