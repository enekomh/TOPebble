var timeout = timeout || {};

timeout.main = function() {
  this.cuisines = ['british', 'italian', 'indian', 'spanish'];
  this.cuisinesNodes = [66,73,35,78];
  this.appLevel = 0;
  this.index = 0;
  this.selectedVenue = 0;
  this.selectedCuisine = 0;
  this.items =  new Array();
  this.steps =  new Array();
  this.init();
};

timeout.main.prototype.init = function() {
  var self = this;
  simply.text({title:"TimeOut", body:"", subtitle:'Let us help you find your closest restaurant'});
  
  setTimeout(function(){self.updateCuisineListText();}, 2000);
  simply.on('singleClick', function(e) {
    self.manageActions(e);
  });
};
                        
timeout.main.prototype.manageActions = function(e) {
  if (e.button == 'select' || e.button == 'back') {
    if (e.button == 'back') {
      this.appLevel -= 2;
    }
    if (this.appLevel < "0") {
      this.updateCuisineListText();
      this.appLevel = 0;
    } else if (this.appLevel == "0") {
      if (e.button != 'back') {
        this.selectedCuisine = this.index;
      } else {
        this.index = this.selectedCuisine;
      }
      this.searchTO(this.cuisinesNodes[this.index]);
      this.appLevel = 1;
    } else if (this.appLevel == "1") {
      if (e.button != 'back') {
        this.selectedVenue = this.index;
      } else {
        this.index = this.selectedVenue
      }
      this.getDirections(this.items[this.index]);
      this.appLevel = 2;
    }
    this.index = 0;
    if (this.appLevel != "0") {
      simply.buttonConfig({back:true, up:true, down:true, select:true});
    } else {
      simply.buttonConfig({back:false, up:true, down:true, select:true});
    }
  } else {
    this.increaseDecreaseIndex(e.button);
    if (this.appLevel == "0" ) {
      this.updateCuisineListText();
    } else if (this.appLevel == "1") {
      this.updatePlaceList();
    } else if (this.appLevel == "2") {
      this.showDirections();
    }
  }
};

timeout.main.prototype.searchTO = function (nodeId) {
  var self = this;
  navigator.geolocation.getCurrentPosition(function(pos) {
    var coords = pos.coords;
    var myUrl = 'http://www.timeout.com/london/search.json?profile=london&_dd=&keyword=&section=restaurants&on=&locationText=&_section_search=restaurants&page_size=5' +
        '&latitude=' + coords.latitude + '&longitude=' + coords.longitude + "&radius=5&nodes[0]="+nodeId;
    ajax({ url: myUrl, type: 'json' }, function(data) {
      var results = data.body.results;
      self.items = new Array();
      for (var i in results) {
        var response = {name: results[i].name, annotation: results[i].annotation , coordinates: results[i].coordinates};
        self.items.push(response);
      }
      self.updatePlaceList();
    });
  });
};

timeout.main.prototype.increaseDecreaseIndex = function(action) {
  var listLength;
  if (this.appLevel == "0") {
    listLength = this.cuisines.length;
  } else if (this.appLevel == "1") {
    listLength = this.items.length;
  } else if (this.appLevel == "2") {
    listLength = this.steps.length;
  }
    
  if (action == 'down') {    
    if (this.index == listLength -1) {
     this.index = 0; 
    } else {
      this.index++;
    }
  } else if (action == 'up') {
    if (this.index == "0") {
      this.index = listLength -1;
    } else {
      this.index--;
    }
  }
};

timeout.main.prototype.updateCuisineListText = function () {
  this.print({title:'What do you fancy today?', subtitle:this.cuisines[this.index] + "?", body:"TimeOut provides a list of the best " + this.cuisines[this.index] + " restaurants"});
};

timeout.main.prototype.print = function(text) {
  
  if (typeof text.title != "undefined") {
    simply.title(text.title);
  }
  if (typeof text.subtitle != "undefined") {
    simply.subtitle(text.subtitle);
  }
  if (typeof text.body != "undefined") {
    simply.body(text.body);
  }
};

timeout.main.prototype.updatePlaceList = function() {
  var venue = this.items[this.index];
  this.print({title:venue.name, subtitle:'', body:venue.annotation});
};

timeout.main.prototype.getDirections = function(venue) {
  var self = this;
  navigator.geolocation.getCurrentPosition(function(pos) {
    var currentCoords = pos.coords.latitude + ","+pos.coords.longitude;
    var myUrl = "http://maps.googleapis.com/maps/api/directions/json?origin="+ currentCoords +"&destination="+ venue.coordinates +"&sensor=false&key=&mode=walking";
    ajax({ url: myUrl, type: 'json' }, function(data) {
      var results = data.routes;
      if (results.length > 0) {
        var steps = results[0].legs[0].steps;
        self.steps = new Array();
        for (var i=0; i<steps.length;i++) {
          var step = steps[i];
          var stepObj = {distance: step.distance.text, duration: step.duration.text, until_lat: step.end_location.lat, until_lng: step.end_location.lng, message: step.html_instructions};
          self.steps.push(stepObj);
        }
      }
      //update the interface
      self.showDirections();
      
    });
  });
};

timeout.main.prototype.showDirections = function() {
  var step = this.steps[this.index];
  this.print({body:this.stripTags(step.message) + " ("+step.distance + "-"+ step.duration+")"});
};

timeout.main.prototype.stripTags = function (taggedString){
  return taggedString.replace(/(<([^>]+)>)/ig,"");
};

new timeout.main();
