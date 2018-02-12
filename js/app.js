'use strict';
/*jshint strict:false */
/*jshint globalstrict: true*/
var map;

/*----Map ViewModel----*/
function MapViewModel (){
    /*Declare global infoWindow object to close an inactive infowindow automatically -
      as per Google Maps best practices - https://developers.google.com/maps/documentation/javascript/infowindows) */
    var infoWindow = new google.maps.InfoWindow();
    /*Marker animation controller*/
    var markerAnim = null;
    
    /*--Park location object constructor--*/
    function Park(obj) {
        var self = this;
        self.title = obj.title;
        self.latitude = obj.location.lat;
        self.longitude = obj.location.lng;
        var defaultIcon = makeMarkerIcon('e74c3c');
        var highlightedIcon = makeMarkerIcon('f1c40f');

        self.parkMarker = new google.maps.Marker({
            title: self.title,
            position: {lat: self.latitude, lng: self.longitude},
            map: map,
            icon: defaultIcon
        });
        
        function makeMarkerIcon(markerColor) {
            var markerImage = new google.maps.MarkerImage(
                'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
                '|40|_|%E2%80%A2',
                new google.maps.Size(21, 34),
                new google.maps.Point(0, 0),
                new google.maps.Point(10, 34),
                new google.maps.Size(21,34));
            return markerImage;
        }
        /*Mouse-events handlers for a park marker*/
        self.parkMarker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        self.parkMarker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
        
        Park.prototype.markerAnim === null;

        self.panToLoc = function (){
            map.panTo({lat: self.latitude, lng: self.longitude});
        };
                
        self.parkMarker.addListener('click', function() {
            self.panToLoc();
            self.populateInfoWindow(self.parkMarker, infoWindow);
            
         });

        self.populateInfoWindow = function(marker, infoWindow) {
          if (infoWindow.marker != marker) {
              infoWindow.marker = marker;
              if (markerAnim) {
                    if(markerAnim != marker){
                        markerAnim.setAnimation(null);
                    }        
              }
              marker.setAnimation(google.maps.Animation.BOUNCE);
              markerAnim = marker;

              var contentString = '<h2 class="park-title">' + self.title + '</h2>';
              infoWindow.setContent(contentString);
              infoWindow.open(map, marker);

          }
        };
    }
    
  /*---------------------------------------------------------------------------------------------------------------------------*/  

    /*--Knockout implementation--*/
    var self = this;
    self.parks = ko.observableArray([]);
    self.searchFilter = ko.observable('');
    self.isVisible = ko.observable(false);
    
    
    /*Parks listing - Create array of parks using locations data and loop through the parks and display all of them*/
    function displayParksListings(data) {
      /*Create a new park var*/
        var park;
        /*Create a new blank array for all the parks markers.*/
        var parkListings = [];
        var bounds = new google.maps.LatLngBounds();
        for(var i = 0; i < data.length; i++){
            park = new Park(data[i]);
            parkListings.push(park);
            /*Extend the boundaries of the map for each park marker and display it*/
            bounds.extend(park.parkMarker.position);
        }
        /*Update parks for KO observable array*/
        self.parks(parkListings);
        /*Set the viewport to contain the given bounds(all park markers).*/
        map.fitBounds(bounds);
        /*Add responsiveness - Resize map whenever window is resized*/
        google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(bounds);
        }); 
    }
    /*Filter through the parks listing and return matched search query*/
    self.searchResults = ko.computed(function () {
        var matchedParks = [];
        /*Build search query*/
        var searchQuery = new RegExp(self.searchFilter(), 'i');
        /*Loop through all the parks and if there is a match with search query store it in matchedParks*/
        for (var i = 0; i < self.parks().length; i++) {
            if(self.parks()[i].title.search(searchQuery) !== -1) {
                matchedParks.push(self.parks()[i]);
                self.parks()[i].parkMarker.setVisible(true);
                self.parks()[i].panToLoc();
            } else {
                self.parks()[i].parkMarker.setVisible(false);
                infoWindow.close();
            }
        }
        return matchedParks;

    });
    
    displayParksListings(locationsData);
    
    self.onClick = function (park){
        park.panToLoc();
        park.populateInfoWindow(park.parkMarker, infoWindow);
         if (window.innerWidth < 1024) {
            self.isVisible(false);
        }

    };
    
    self.toggleDisplay = function() {
        self.isVisible(!self.isVisible());
    };

}

/*Initialize Map*/
function initMap() {
  /*Create a new map */
  var rtpArea = {lat: 35.784393, lng: -78.825690};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: rtpArea,
    mapTypeControl: false
  });

  /*Apply knockout bindings*/  
  ko.applyBindings(new MapViewModel());
}
/*Error handler for map */
function errorOnLoad() {
    alert('Loading Google Maps API : Failed!');
}