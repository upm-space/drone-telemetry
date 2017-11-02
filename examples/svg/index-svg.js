var cEnable = "0, 153, 0";
var cDisable = "217, 255, 179";
var cBorder = "242, 255, 230";

function paint() {
  var svjObj = document.getElementById('svg-status');
  // var svgString = `<rect width="300" height="100" style="fill:rgb(255,0,255);stroke-width:3;stroke:rgb(0,255,0)" />`;
  var svgString = paintCircle(30,30,40);
  paintCircles(650,["Primero","Segundo","Tercero","Cuarto", "Quinto"],1);
  //addSvgToObject(svgString,'svg-status');
}

function addSvgToObject(svg,idCanvas){
  var receptacle = document.createElement('div');
  var svgfragment = '<svg>' + svg + '</svg>';
  receptacle.innerHTML = '' + svgfragment;
  Array.prototype.slice.call(receptacle.childNodes[0].childNodes).forEach(function (el) {
    document.getElementById(idCanvas).appendChild(el)})
}

function cleanSvgToObject(idCanvas){
  var receptacle = document.createElement('div');
  var svgfragment = '<svg></svg>';
  receptacle.innerHTML = '' + svgfragment;
  Array.prototype.slice.call(receptacle.childNodes[0].childNodes).forEach(function (el) {
    document.getElementById(idCanvas).appendChild(el)})
}

function paintCircles(height,text,index){
  var numberOfCircles = text.length;
  var centroidsDis = Math.round(height/numberOfCircles);
  lineP1XY = [centroidsDis/2,centroidsDis/2];
  lineP2XY = [centroidsDis/2, (height - (centroidsDis))]
  var lineWidth = Math.round(centroidsDis * 0.05);
  var svgStr = paintLine(lineP1XY,lineP2XY,lineWidth);

  var counter = 0;
  text.forEach((item) => {
    var backColor = "";
    counter === index ? backColor = cEnable : backColor = cDisable;
    var x = centroidsDis/2
    var y = (centroidsDis/2) + (centroidsDis*counter);
    var innerRadius = Math.round((centroidsDis/2) * 0.5);
    svgStr += paintCircle(x, y, (innerRadius + lineWidth) , cBorder );
    svgStr += paintCircle(x, y, innerRadius, backColor );
    svgStr += paintText(15, x , y, item);
    counter += 1;
  })

  cleanSvgToObject('svg-status');
  addSvgToObject(svgStr,'svg-status');
}

function paintLine(p1, p2, width) {
  return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" style="stroke:rgb(${cBorder});stroke-width:${width}" />`
}
function paintCircle(x,y,r,fill){
  var circle = `<circle cx="${x}" cy="${y}" r="${r}" style="fill:rgb(${fill})"/>`
  return circle;
}
function paintText(fontSize, x, y, text){
  return `<text x="${x}" y="${y}" font-size="${fontSize}"
  text-anchor="middle" alignment-baseline="middle">
    ${text}
</text>`;
}
