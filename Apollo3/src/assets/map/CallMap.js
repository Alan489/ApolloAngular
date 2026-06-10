async function initMap() {
  const gmp = document.querySelector("gmp-map");

  function applyOptions() {
    const map = gmp.innerMap;


    map.setOptions({
      disableDefaultUI: true,
      keyboardShortcuts: false,
      colorScheme: google.maps.ColorScheme.DARK
    });
  }
  if (gmp.innerMap) {
    google.maps.event.addListenerOnce(gmp.innerMap, "idle", applyOptions);

  } else {

    gmp.addEventListener("gmp-ready", applyOptions);
  }


}

window.initMap = initMap;


var polys = {}
var lines = {}

function removePoly(id) {
  if (polys[id] != null) {
    polys[id].setMap(null);
    polys[id] = null;
  }
  return 0;
}

function removeLine(id) {
  if (lines[id] != null) {
    lines[id].setMap(null);
    lines[id] = null;
  }
  return 0;
}



function createPoly(obj) {
  const gmp = document.querySelector("gmp-map");
  const map = gmp.innerMap;
  var coords = {};
  polys[obj.id] = new google.maps.Polygon({
    paths: Object.values(obj.c2),
    strokeColor: obj.color,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: obj.color,
    fillOpacity: 0.35,
  });
  polys[obj.id].setMap(map);
  return 0;
}

function createLine(obj) {

  const gmp = document.querySelector("gmp-map");
  const map = gmp.innerMap;
  var coords = {};
  lines[obj.id] = new google.maps.Polyline({
    path: Object.values(obj.c2),
    strokeColor: obj.color,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillOpacity: 0.35,
  });
  lines[obj.id].setMap(map);
  return 0;
}

window.createPoly = createPoly;
window.removePoly = removePoly;

window.createLine = createLine;
window.removeLine = removeLine;
