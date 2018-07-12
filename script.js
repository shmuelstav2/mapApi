var subscriptionKey = "GZOzv3QngwNCQtJOo5dCw2iYG_zdzamuvaICKaKV970";
var map = new atlas.Map("map", {
    "subscription-key": subscriptionKey
});

// Define objects for holding the pins and popups
var searchLayerName = "search-results";
var searchPins = [];
var searchPopups = {};

// For a successful search request, add pins and popups for the results to the map
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {

    if (this.readyState === 4 && this.status === 200) {
        var response = JSON.parse(this.responseText);

        var poiResults = response.results.filter(function (result) { return result.type === "POI" }) || [];

        poiResults.map(function (poiResult) {
            var poiPosition = [poiResult.position.lon, poiResult.position.lat];

            // Create a pin per result
            searchPins.push(new atlas.data.Feature(new atlas.data.Point(poiPosition), {
                popupId: poiResult.id,
                name: poiResult.poi.name,
                address: poiResult.address.freeformAddress,
                position: poiResult.position.lat + ", " + poiResult.position.lon
            }));

            // Build a popup per result
            var popupContentElement = document.createElement("div");
            popupContentElement.style.padding = "5px";

            var popupNameElement = document.createElement("div");
            popupNameElement.setAttribute("aria-label", "Name");
            popupNameElement.innerText = poiResult.poi.name;
            popupContentElement.appendChild(popupNameElement);

            var popupAddressElement = document.createElement("div");
            popupAddressElement.setAttribute("aria-label", "Address");
            popupAddressElement.innerText = poiResult.address.freeformAddress;
            popupContentElement.appendChild(popupAddressElement);

            var popupPositionElement = document.createElement("div");
            popupPositionElement.setAttribute("aria-label", "Latitude and Longitude");
            popupPositionElement.innerText = poiResult.position.lat + ", " + poiResult.position.lon;
            popupContentElement.appendChild(popupPositionElement);

            searchPopups[poiResult.id] = new atlas.Popup({
                position: poiPosition,
                content: popupContentElement
            });

            searchPopups[poiResult.id].attach(map);
        });

        // Add pins to the map
        map.addPins(searchPins, {
            name: searchLayerName,
            cluster: false,
            icon: "pin-round-darkblue"
        });

        // Set the camera to the bounds of the pins
        var lons = searchPins.map(function (pin) { return pin.geometry.coordinates[0] });
        var lats = searchPins.map(function (pin) { return pin.geometry.coordinates[1] });

        var swLon = Math.min.apply(null, lons);
        var swLat = Math.min.apply(null, lats);
        var neLon = Math.max.apply(null, lons);
        var neLat = Math.max.apply(null, lats);

        map.setCameraBounds({
            bounds: [swLon, swLat, neLon, neLat],
            padding: 50
        });
    }
};

// Build the request URL
var url = "https://atlas.microsoft.com/search/fuzzy/json?";
url += "&api-version=1.0";
url += "&query=gasoline%20station";
url += "&subscription-key=" + subscriptionKey;
url += "&lat=47.6292";
url += "&lon=-122.2337";
url += "&radius=100000";

// Execute the request
xhttp.open("GET", url, true);
xhttp.send();

// Add a click event listener to the pin layer to open a pin's corresponding popup on 'click'
map.addEventListener("click", searchLayerName, function (e) {
    searchPopups[e.features[0].properties.popupId].open(map);
});

// Add an event listener to the pin layer to change the cursor on hover 'mouseover'
map.addEventListener("mouseover", searchLayerName, function (e) {
    map.getCanvas().style.cursor = 'pointer';
});

map.addEventListener('mouseleave', searchLayerName, function(e) {
    map.getCanvas().style.cursor = '';
});