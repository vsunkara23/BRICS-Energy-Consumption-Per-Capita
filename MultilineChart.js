/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

// Creating svg element and its properties.
var svg = d3.select("svg"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// gridlines in x axis function
function gridXaxis() {		
    return d3.axisBottom(x)
        .ticks(5)
}

// gridlines in y axis function
function gridYaxis() {		
    return d3.axisLeft(y)
        .ticks(5)
        
}
// To parse values into date object later.
var parseTime = d3.timeParse("%Y");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

// Used curve basis to interpolate data
var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.country); });

var sub = [];
var data_array = [];

// Reading csv file as is without transposing rows and columns before.
d3.csv("BRICSdata.csv").then(function (data) {
  // Programmatically transposing rows and columns.
  data.forEach(function(d) { 
    for(var key in d) {
        var obj = {};
        if (key != "Country") {
            obj.date = key;
        }   
        Object.defineProperty(obj, d.Country, {
            value: d[key],
            enumerable: true
        });
        if (d[key] != d.Country){
            sub.push(obj)
        }
    }
    // sorting data structure by date value in ascending order.
    sub.sort(function compare(a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });  
    // Merging all country ECP values for common date.
    var obj2 = {};
    for(var i = 0; i < sub.length; i++){
        var year = sub[i].date;
        var prev_year = obj2[year] || {}; 
        obj2[year] = Object.assign(prev_year, sub[i])
    }
    // Finalizing dataset with columns key and its respective 
    // value pairs to be able to use columns.slice() method later on
    // for mapping.
    data_array = Object.values(obj2);
    data_array["columns"] = ["date", "Brazil", "Russia", "India", "China", "South Africa", 
    "United States"];
  }); 
  // From array data structure data_array, returning map of date and country 
  // EPC values into 'countries'.  
  var countries = data_array.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data_array.map(function(d) {
        return {date: parseTime(d.date), country: parseInt(d[id])};
      })
    };
  });
  //  Consists of the range from min to max value for years -> 2000-2014
  x.domain(d3.extent(data_array, function(d) { return parseTime(d.date); }));
  
  // Consists of range of EPC values.
  y.domain([
    d3.min(countries, function(c) { return d3.min(c.values, function(d) { return d.country; }); }),
    d3.max(countries, function(c) { return d3.max(c.values, function(d) { return d.country; }); })
  ]);
  //  Consists of country names
  z.domain(countries.map(function(c) { return c.id; }));
    
 // Adding the X gridlines.
  g.append("g")			
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(gridXaxis()
          .ticks(10)
          .tickSize(-height)
          .tickFormat("")
      )

  // Adding the Y gridlines.
  g.append("g")			
      .attr("class", "grid")
      .call(gridYaxis()
          .tickSize(-width)
          .tickFormat("")
      )
  // Adding x axis.
  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
  // Adding y axis.
  g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y).ticks(7))
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .attr("y", 0-margin.left)
      .attr("x", 0-(height/2))
      .attr("dy", ".75em")
      .style("text-anchor", "middle")
      .text("Million BTUs Per Person");
   
      
  var country = g.selectAll(".country")
    .data(countries)
    .enter().append("g")
      .attr("class", "country");
    
  // Defining line path for the countries.
  var path = country.append("path")
      .attr("class", function(d) { return d.id; })
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return z(d.id); })
      .attr("stroke-width", "2")
      .attr("fill", "none");

  // Getting length of the path or line representing the data for a country.
  var totalLength = path.node().getTotalLength();
    
  // Adding attributes and animation to path.
  path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .attr("class", "visualization")
    .attr("xlmns", "https:www.w3.org/2000/svg")
    .transition()
      .duration(2000)
      .attr("stroke-dashoffset", 0);
    
  // adding country name at the end of graph line.
  country.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.country) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .text(function(d) { return d.id; })
      .style('opacity', 0)
       .transition()
       .duration(2000)
       .style('opacity', 1);

// If checkbox is clicked on, action performed in function selectDataset().
d3.selectAll("input")
	.on("click", selectDataset);
    
// This function filters the path so that when a box 
// is unchecked, animation of corresponding path which describes the line in   
// the graph is changed. 
function selectDataset()
{
	var value = this.value;
    var condition = this.checked;
	if (value === "Brazil" && condition === true)
	{
        path
            .filter(function (d,i) {return i==0;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==0;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
        
	}
	else if (value === "Russia" && condition === true)
	{
        path
            .filter(function (d,i) {return i==1;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==1;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
	}
	else if (value === "India" && condition === true)
	{
        path
            .filter(function (d,i) {return i==2;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==2;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
        
	}
    else if (value === "China" && condition === true)
	{
        path
            .filter(function (d,i) {return i==3;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==3;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
        
	}
    else if (value === "South Africa" && condition === true)
	{
        path
            .filter(function (d,i) {return i==4;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==4;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
        
	}
    else if (value === "United States" && condition === true )
	{
        path
            .filter(function (d,i) {return i==5;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
        country
            .filter(function (d, i) {return i==5;})
            .transition()
            .duration(2000)
              .style('opacity', 1)
        
	}
    else if (value === "Brazil" && condition === false)
	{
        path
            .filter(function (d,i) {return i==0;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
            .filter(function (d, i) {return i==0;})
            .transition()
            .duration(2000)
              .style('opacity', 0)
        
	}
    else if (value === "Russia" && condition === false)
	{
        path
            .filter(function (d,i) {return i==1;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
           .filter(function (d, i) {return i==1;})
           .transition()
            .duration(2000)
              .style('opacity', 0)
        
	}
    else if (value === "India" && condition === false)
	{
        path
            .filter(function (d,i) {return i==2;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
           .filter(function (d, i) {return i==2;})
           .transition()
            .duration(2000)
              .style('opacity', 0)
        
	}
    else if (value === "China" && condition === false)
	{
        path
            .filter(function (d,i) {return i==3;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
            .filter(function (d, i) {return i==3;})
            .transition()
            .duration(2000)
              .style('opacity', 0)
        
	}
    else if (value === "South Africa" && condition === false)
	{
        path
            .filter(function (d,i) {return i==4;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
            .filter(function (d, i) {return i==4;})
            .transition()
            .duration(2000)
              .style('opacity', 0)
	}
    else if (value === "United States" && condition === false)
    {
        path
            .filter(function (d,i) {return i==5;})
            .transition()
              .duration(2000)
              .attr("stroke-dashoffset", totalLength);
        country
            .filter(function (d, i) {return i==5;})
            .transition()
            .duration(2000)
              .style('opacity', 0)
        
	}
}
    
var mouseG = g.append("g")
                  .attr("class", "mouse-over-effects");

    // Adding vertical line
    mouseG.append("path") 
      .attr("class", "mouse-line")
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("opacity", "0");
      
    // Collecting lines from the graph
    var lines = document.getElementsByClassName('visualization');

    // Instantiating variable to access all the lines through mouse cursor.
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
                              .data(countries)
                              .enter()
                              .append("g")
                              .attr("class", "mouse-per-line");
    // Adding circle to line when mouse cursor is placed on chart.
    mousePerLine.append("circle")
                .attr("r", 7)
                .style("stroke", function(d) {
                  return z(d.id);
                })
                .style("fill", "none")
                .style("stroke-width", "1px")
                .style("opacity", "0");
    // Adding data value text to every line.
    mousePerLine.append("text")
      .attr("transform", "translate(10,-5)")
      .style("font", "12px sans-serif");

    // Capturing mouse movements.
    mouseG.append('svg:rect') 
      .attr('width', width) 
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      // If mouse is outside graph, lines, circles, and text are hidden.
      .on('mouseout', function() { 
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      // If mouse on graph, line, circles and text are shown.
      .on('mouseover', function() { 
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })
      // Function for mouse moving over grah. 
      .on('mousemove', function() { 
        var mouse = d3.mouse(this);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + height;
            d += " " + mouse[0] + "," + 0;
            return d;
          });
        var pos;
        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {

            var beginning = 0,
                end = lines[i].getTotalLength(),
                target = null;
            var condition = true;
            while (condition){
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                  break;
              }
              if (pos.x > mouse[0])      end = target;
              else if (pos.x < mouse[0]) beginning = target;
              else break; 
            }
            d3.select(this).select('text')
              .text(y.invert(pos.y).toFixed(2));
            return "translate(" + mouse[0] + "," + pos.y +")";
          });
      });   
});

