const jquery = require('jquery');
$ = window.$ = window.jQuery = jquery;

//var endpoint = 'https://cors-anywhere.small-service.gpeastasia.org/https://cloud.greentw.greenpeace.org/websign-dummy';
var endpoint = 'https://cloud.greentw.greenpeace.org/websign';
//var appScriptUrl = 'https://script.google.com/macros/s/AKfycbxv51TSdarVToqYywWgSjOpz0wy4ml1HYh4WkMgv5uNRHlVtzZikO0wJu5ZpVZ3bjPp/exec';//dummy
var appScriptUrl = 'https://script.google.com/macros/s/AKfycbwl2OACweJFklrhOlWT_Do9n68b6DLWcpPBAYDEqGfab9nJqLUJmv7QRz9FoyGl5MFw/exec';
var successful_list = [];
var failed_list = [];

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

    $(".thank-you-div .content").html(result_str + $(".thank-you-div .content").html());
    
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
        successful_list.push(document.getElementById(`fullName-session${labelSessions[curr_ind]}`).value);                    
        regResult(curr_ind, sessionSize);        

        fetch(appScriptUrl, {
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
  dict['CampaignData5__c'] = window.location.href;

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
 * main thread
 */
document.addEventListener("DOMContentLoaded", function(event) { 
  showFullPageLoading(true);

  // create the year options
	let currYear = new Date().getFullYear();
  let obj = document.getElementById('Birthdate');
  for (var i = 0; i < 100; i++) {
    //let option = `<option value="${currYear-i}-01-01">${currYear-i}</option>`;    
    obj.add(new Option(currYear-i, `${currYear-i}-01-01`));
  }
  obj.selectedIndex = 21;

  var events = []

  /**
   * Populate the events data to the checkbox elements
   * @param  {[{"CampaignId":string, "Event Display Name":string, "Max Signups":number}]}
   */
  const populateEventSelections = (events) => {
    let sessionDOM = document.querySelector(".webinar-sessions");
    //let selectDOM = document.querySelector(".select-sessions");//
    if ( !sessionDOM) {
      throw "Cannot find the webinar-sessions DOM."
    }

    sessionDOM.innerHTML = ''; // clear loading content    

    let topics = [];
    let topicSessions = [];

    // populate the events to the select element    
    let newTopicIndex = 0
    events.forEach((row, k) => {
      
      // creating hidden input for EndDate
      let endDate = document.createElement('input');
      endDate.type = "hidden";
      endDate.id = `endDate${k}`;
      endDate.value = row["From DateTime"].substr(0, 10).replace(/\//g, "-");

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
       
      // appending the created text to the created label tag
      if (row["Max Signups"] == 0 || !row["CampaignId"]) {
        label.appendChild(document.createTextNode(`${row["Session"]}（已額滿）`));        
      } else {
        label.appendChild(document.createTextNode(`${row["Session"]}`));
      }             
      
      // for display
      let topicBgColor = '#edf9d1';
      if (newTopicIndex % 2) {
        topicBgColor = '#ffffff';
      }
      if (topics.includes(row["Event Display Name"])) {
        let topicIndex = topics.indexOf(row["Event Display Name"]);

        // add the non-first session
        // get the container, and appending the checkbox and label to it     
        let fullNameInput = document.createElement('input');
        fullNameInput.type = 'hidden';        
        fullNameInput.id = `fullName-session${k}`;
        fullNameInput.value = `${row["Session"]} ${row["Event Display Name"]}`;

        let containerDiv = topicSessions[topicIndex];
        //containerDiv.className = "form__session";
        containerDiv.appendChild(checkbox);
        containerDiv.appendChild(label);
        containerDiv.appendChild(endDate);
        containerDiv.appendChild(fullNameInput);
        
        sessionDOM.appendChild(containerDiv);

      } else {
        // add Event Display Name to topics[]
        topics.push(row["Event Display Name"]);
        newTopicIndex++;        

        // creating label for this Event Display Name
        // creating div as container
        let topicDiv = document.createElement('div');      
        topicDiv.className = "form__topic";
        let topicLabel = document.createElement('label');        
        topicLabel.appendChild(document.createTextNode(`${row["Event Display Name"]}`));
        topicDiv.appendChild(topicLabel);                
        topicDiv.style.backgroundColor = topicBgColor;

        sessionDOM.appendChild(topicDiv);

        // add the first session        
        // creating div as container, and appending the checkbox and label to it        
        let fullNameInput = document.createElement('input');
        fullNameInput.type = 'hidden';        
        fullNameInput.id = `fullName-session${k}`;
        fullNameInput.value = `${row["Session"]} ${row["Event Display Name"]}`;

        let containerDiv = document.createElement('div');      
        containerDiv.className = "form__session";
        containerDiv.appendChild(checkbox);
        containerDiv.appendChild(label);
        containerDiv.appendChild(endDate);
        containerDiv.appendChild(fullNameInput);
        containerDiv.style.backgroundColor = topicBgColor;                

        // add containerDiv to topicSessions[]
        topicSessions.push(containerDiv);

        sessionDOM.appendChild(containerDiv);
      }      

      // disable the checkbox of full session
      if (row["Max Signups"] == 0 || !row["CampaignId"]) {        
        document.getElementById(`session${k}`).disabled = true;
        label.className = "session-is-full";
      }
      if (row["is-full"]) {        
        document.getElementById(`session${k}`).disabled = true;
        label.className = "session-is-full";
        label.innerText += "（已額滿）";
      }

    })
  }

  // fetch content / image
  fetch("https://docs.google.com/spreadsheets/u/0/d/1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ/export?format=csv&id=1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ&gid=1562944622")
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
          document.getElementsByClassName("img-div")[0].innerHTML = `<img src='${currentline[1].trim()}' style='width:100%;' />`;
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
        }

      }
    });

  // step 1: fetch events from gsheet
  // See howto use gsheet as DB
  //fetch("https://docs.google.com/spreadsheets/u/0/d/1XsDBcedsKMY4yCpB3BGbnbQ7bmxlFkSVJiPy96-w4IQ/export?format=csv&id=1XsDBcedsKMY4yCpB3BGbnbQ7bmxlFkSVJiPy96-w4IQ&gid=0")
  fetch("https://docs.google.com/spreadsheets/u/0/d/1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ/export?format=csv&id=1zf00KMnjfJY9lHou15jHREaRD9PBK6AgjNialKNkzGQ&gid=0")
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
      console.log('response', response)

      //let rows = response.rows;
      let rows = response;
      
      rows.forEach(serverRow => {
        let campaignId = serverRow["Id"]
        
        // find that campaign
        let idx = events.findIndex(e => e.CampaignId===campaignId);
        if (idx > -1) {
          let numRes = parseInt(serverRow["NumberOfResponses"], 10);
          let targetSignups = parseInt(events[idx]["Max Signups"], 10);
          
          if (numRes >= targetSignups) {
            //events[idx]["Event Display Name"] += "（已額滿）";// += `(${numRes.toLocaleString()}/${targetSignups.toLocaleString()} 已額滿)`
            events[idx]["is-full"] = true;
          }
          // } else {
          //   events[idx]["Event Display Name"];// += `(${numRes.toLocaleString()}/${targetSignups.toLocaleString()})`
          // }          
        }
      });
      populateEventSelections(events) // update the display names

      hideFullPageLoading();
    });

  formValidate();
});