// state level countyCase data
var stateAccidents = {};
var accData;
var trendData;
// state map
let topodata;
let state;
let stateMesh;
let projection1;
let projectPath1;

// state map constants
const margin = { top: 20, right: 80, bottom: 20, left: 20 };
const stateColorWidth = 50; // state legend level width
const stateColorHeight = 20;
const stateColors = ["#FCCB79", "#FFB627", "#FF9505", "#E2711D", "#CC5803"]; // state heatmap colors

//slider selection setting
const minYear = 2000;
const maxYear = 2024;
const yearInterval = maxYear - minYear;

// initial setting
const defaultYear = 2020;
// record last clicked state
let lastSelectedStateID;
var dataIsLoaded1 = false;

// variables for state map
let stateMap = d3.select("svg#state_case");
// load width and hight from svg element
let stateWidth = stateMap.attr("width");
let stateHeight = stateMap.attr("height");

let innerPlotWidth = stateWidth - margin.left - margin.right;
let innerPlotHeight = stateHeight - margin.bottom - margin.top;
var colorScaleState;
var maxValue;

let lastSelectedCaseType; // remember the previous selected casetype
let typeSelector = d3.select("#typeselector");
let typeSelectorWidth = typeSelector.attr("width");
let typeRects = stateMap.append("g");
let selectIndicatorY = typeSelectorWidth * 1.2;

const childcareTypes = ["Total_CC", "Other_CC", "FDH"];

const trendLineColors = {
    "Total Childcare": "#ffca3a",
    "0-4Yrs Population": "#8ac926",
    "Family Day Care": "#4267ac",
    "Population(thousand)": "black",
};

let countyDetails = {};
childcareTypes.forEach((d, i) => {
    countyDetails[d] = null;
});
// type name mapping
let typeNameMapper = {};
Object.keys(trendLineColors).forEach((d, i) => {
    typeNameMapper[childcareTypes[i]] = d;
});

// year select sliderbar
var slider = d3
    .sliderHorizontal()
    .min(minYear)
    .max(maxYear)
    .step(1)
    .width(600)
    .value(defaultYear)
    .tickFormat(d3.format(""))
    .on("onchange", (val) => {
        d3.select("#value").text(val);
        // load state data
        // drawStatePlot(val);     // draw state map plot

        // keep the selected state static while the year selected is changed

        if (lastSelectedStateID != null || lastSelectedCaseType != null) {
            drawStatePlot(val);
            drawCountyPlot(lastSelectedStateID, val, lastSelectedCaseType);
            drawTrendPlot(lastSelectedStateID);
        } else {
            drawStatePlot(defaultYear);

            drawCountyPlot(36, val, "Total_CC"); // NY(fipcode:36) is initial selected, Total_CC is default
            drawTrendPlot(36);
        }
    });

// set slider into point cursor
d3.select("track-overlay").style("cursor", "point");

// select and set year selector location
d3.select("#slider")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", "translate(20,30)")
    .call(slider);

// state map elements
let stateView = stateMap
    .append("g")
    .attr("transform", `translate(${margin.left + 20}, ${margin.top})`);

// state information box group while hovering
let stateInfoBox = stateMap
    .append("g")
    .attr("transform", `translate(${innerPlotWidth * 0.75}, ${10})`)
    .attr("visibility", "hidden");

// set data type selector
childcareTypes.forEach((d, i) => {
    const rectWidth = (typeSelectorWidth - 10) / 3;
    const rectHeight = 40;
    const rectX = i * rectWidth;
    const rectY = 0;
    const fillColor = "#EF9C66";
    const textColor = "#FFF6E9";
    typeSelector
        .append("rect")
        .attr("class", "datatype-rects")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", fillColor)
        .attr("x", rectX)
        .attr("y", rectY)
        .attr("rx", 5)
        .attr("id", d);

    typeSelector
        .append("text")
        .text(d)
        .attr("class", "datatype-text")
        .attr("x", rectX + rectWidth / 2)
        .attr("y", rectY + rectHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("id", d)
        .text(d)
        .attr("fill", textColor);
});

// state infobox frame
let infoBox = stateInfoBox
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 5)
    .attr("width", 200)
    .attr("height", innerPlotHeight * 0.1)
    .attr("opacity", 0.2)
    .style("fill", stateColors[4]);

// content: state name
let txtState = stateInfoBox
    .append("text")
    .attr("x", 10)
    .attr("y", 18)
    .attr("class", "infobox");

let txtCase = stateInfoBox
    .append("text")
    .attr("x", 10)
    .attr("y", 35)
    .attr("class", "infobox");

// add state map color legends group
let stateColorLegend = stateMap
    .append("g")
    .attr("transform", `translate(0, ${stateHeight - 20})`);

// draw state case legend box
stateColors.forEach((color, i) => {
    stateColorLegend
        .append("rect") // each color represent one heatmap level
        .attr("x", stateColorWidth + i * stateColorWidth)
        .attr("y", -10)
        .attr("width", stateColorWidth)
        .attr("height", stateColorHeight)
        .attr("fill", color);
});

// write legend text
stateColorLegend
    .append("text")
    .text("Density Label")
    .attr("class", "legendtitle")
    .attr("x", stateColorWidth)
    .attr("y", -15);

async function loadStateCaseData() {
    accData = await d3.csv("data/stateCaseData.csv");
    accData = accData.map((obj) =>
        Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (
                    key === "Total_CC" ||
                    key === "FDH" ||
                    key === "Other_CC" ||
                    key === "stFips" ||
                    key === "Year"
                ) {
                    return [key, Number(value)];
                }
                return [key, value];
            })
        )
    );
}

// load u.s map outline data
async function loadStateTopoJson() {
    topodata = await d3.json("data/us-smaller.json");
    //states
    state = topojson.feature(topodata, topodata.objects.states);
    //outline
    stateMesh = topojson.mesh(topodata, topodata.objects.states);
    projection1 = d3.geoAlbersUsa()
        .fitSize([innerPlotWidth, innerPlotHeight], state);
    projectPath1 = d3.geoPath().projection(projection1);
}

// load data for map content
async function drawStatePlot(year) {
    if (!dataIsLoaded1) {
        // load data if it is initial loading  
        await loadStateTopoJson();
        await loadStateCaseData();
        dataIsLoaded1 = true;
    }
    // filter data by selecting correct year
    accDataSelected = accData.filter(function (d) {
        return d.Year === year;
    });

    accDataSelected = accDataSelected.sort((a, b) => a.stFips - b.stFips);

    function chooseCaseType(accDataSelected, casetype) {
        /* state map */
        // scales
        let ext = d3.extent(accDataSelected, (d) => d[casetype]);
        colorScaleState = d3.scaleQuantile().domain(ext).range(stateColors);
        quantile_edge = colorScaleState.quantiles().map((d) => parseInt(d));
        quantile_range = [ext[0], ...quantile_edge, ext[1]];

        // color state legend text
        stateColorLegend
            .selectAll("text.selector-content")
            .data(quantile_range)
            .join("text")
            .attr("class", "selector-content")
            .attr("x", (d, i) => stateColorWidth + i * stateColorWidth)
            .attr("y", 20)
            .text((d, i) => (i === 0 ? 0 : d));

        //state map outline
        stateView
            .selectAll("path.state")
            .data(state.features)
            .join("path")
            .attr("class", "state")
            .attr("d", projectPath1)
            .on("mouseover", mouseEntersState)
            .on("mouseout", mouseLeavesState)
            .on("click", stateClicked);

        stateView
            .append("path")
            .datum(stateMesh)
            .join("path")
            .attr("class", "state-outline")
            .attr("d", projectPath1);

        stateView
            .selectAll("path.state")
            .data(accDataSelected)
            .join("path")
            .attr("class", "state")
            .style("fill", (d, i) => {
                if (d[casetype] === 0) {
                    return "darkgray";
                }
                return colorScaleState(d[casetype]);
            });

        // state hovering, including mouseEntering and mouseOut events
        function mouseEntersState(event) {
            let selected = d3.select(this).datum();
            stateInfoBox.attr("visibility", "");
            txtState.text(selected["state_name"] + " State");
            if (selected[casetype] === 0) {
                txtCase.text("No Case records");
            } else {
                txtCase.text(`#${casetype} in ${year} : ${selected[casetype]}`);
            }
        }

        function mouseLeavesState(event) {
            txtState.text("");
            txtCase.text("");
            stateInfoBox.attr("visibility", "hidden");
        }
        return casetype;
    }
    // the switch between these three varaibles should be smooth
    // 1-1. state click  -> Year -> type
    // 1-2. state click  -> type -> Year
    // 2-1. year slider -> state -> type
    // 2-2. year slider -> type -> state
    // 3-1. data type click -> state -> Year
    // 3-2. data type click -> Year -> state


    // the default setting is Total_CC. Set the selectCaseType to be Total_CC while the web is initialized.
    if (lastSelectedCaseType === undefined) {
        lastSelectedCaseType = "Total_CC";
        chooseCaseType(accDataSelected, lastSelectedCaseType);
    } else {
        chooseCaseType(accDataSelected, lastSelectedCaseType);
    }

    d3.selectAll("rect.datatype-rects").on("click", DataTypeClicked);
    d3.selectAll("text.datatype-text").on("click", DataTypeClicked);

    function DataTypeClicked(event) {

        lastSelectedCaseType = event.target.id;

        chooseCaseType(accDataSelected, lastSelectedCaseType);
        drawCountyPlot(lastSelectedStateID, year, lastSelectedCaseType);
    }

    function stateClicked(event) {
        let selected = d3.select(this).datum();
        // fipcode 2(Alaska) fipcode 15(Hawaii) should be excluded
        // if (selected.fips !== 2 && selected.fips != 15) {
        drawCountyPlot(selected.stFips, year, lastSelectedCaseType);
        drawTrendPlot(selected.stFips);
    }
}

var dataIsLoaded2 = false;
// countyCase count by county and severity
var countyCase;
var countyAccidents = {};
// variables needed for county map
var us;
let states;
let statesMesh;
let counties;
let countiesMesh;
let projection2;
let path;
var countyOutlines;
// variables needed for severity quarterly chart
var selectedYear;
var selectedState;

// link states and counties to FIPs (as ids) in topojson
let stateFips = {};
let countyFips = {};

// county map dimensions
const countyMap = d3.select("svg#county");
const countyWidth = countyMap.attr("width");
const countyHeight = countyMap.attr("height");
const countyMapWidth = countyWidth;
const countyMapHeight = countyHeight - 40;
const countyColorWidth = 50;
const countyColorHeight = 20;
const countyColors = ["#FFD1DC", "#FC8EAC", "#DE3163", "#C32148", "#800020"]; // county map heatmap colors


// trend type
let dataIsLoaded3 = false;

const trendMargin = { top: 100, right: 200, bottom: 30, left: 80 };
const yearTrend = d3.select("svg#trend-by-year");
const trendWidth = yearTrend.attr("width");
const trendHeight = yearTrend.attr("height");
const trendInnerWidth = trendWidth - trendMargin.left - trendMargin.right;
const trendInnerHeight = trendHeight - trendMargin.top - trendMargin.bottom;

const trendLinePointRadius = 7;
let dataTypeIsChosen = false;

// coloring trend line
// draw trend plot
// draw trend plot axis
let Xaxis = yearTrend.append("g");
let Yaxis = yearTrend.append("g");

let trendPlot = yearTrend.append("g");
let trendLegend = yearTrend
    .append("g")
    .attr("transform", `translate(0, ${trendHeight - trendMargin.bottom})`);

Object.entries(trendLineColors).forEach((d, i) => {
    // legend colors
    trendLegend
        .append("rect")
        .attr("x", i * 120)
        .attr("y", 5)
        .attr("width", 120)
        .attr("height", 25)
        .attr("fill", d[1]);
    // legend text
    trendLegend
        .append("text")
        .attr("x", i * 120)
        .attr("y", 0)
        .attr("fill", "black")
        .text(d[0]);
});

// draw county map
let countyView = countyMap.append("g");
countyView
    .select("path.county-outline")
    .datum(countiesMesh)
    .join("path")
    .attr("class", "county-outline")
    .attr("d", path);

// add county map color legends group
let countyColorLegend = countyMap
    .append("g")
    .attr("transform", `translate(0, ${countyHeight - 50})`);

let countyLegends = [];

// draw county case legend box
countyColors.forEach((color, i) => {
    countyColorLegend
        .append("rect") // a rect means one color within the legend
        .attr("x", countyColorWidth + i * countyColorWidth)
        .attr("y", 0)
        .attr("width", countyColorWidth)
        .attr("height", countyColorHeight)
        .attr("fill", color);
});
// draw county case legend scale text
for (var i = 0; i < 6; i++) {
    countyLegends.push(
        countyColorLegend
            .append("text")
            .attr("x", countyColorWidth + i * countyColorWidth)
            .attr("y", 30)
            .attr("class", "selector-content")
    );
}
// legend box name
countyColorLegend
    .append("text")
    .text("Childcare Density")
    .attr("x", countyColorWidth)
    .attr("y", -5);
//TODO: fix legend scale colors, fill gray if NA or 0
const countExtent = [10, 40, 50, 70, 80];

const colorScaleCounty = d3
    .scaleQuantize()
    .domain(countExtent)
    .range(countyColors);

// color county legend text
let thresholds = colorScaleCounty.thresholds();
countyLegends.forEach((legendtxt, i) => {
    if (i === 0) {
        legendtxt.text(countExtent[0]);
    } else if (i < 5) {
        legendtxt.text(thresholds[i - 1] | 0);
    } else {
        legendtxt.text(countExtent[1]);
    }
    legendtxt.attr("visibility", "");
});

// county infobox width/height
let boxWidth = 200;
let boxHeight = 100;

let countyInfoBox = countyMap
    .append("g")
    .attr("class", "countyInfoBox")
    .attr("transform", `translate(${countyWidth * 0.75}, 20)`)
    .attr("visibility", "hidden");

countyInfoBox
    .append("rect")
    .attr("fill", countyColors[4])
    .attr("opacity", 0.3)
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 5)
    .attr("width", boxWidth)
    .attr("height", boxHeight);

let countyName = countyInfoBox
    .append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("class", "infobox");

Object.keys(countyDetails).forEach((key, i) => {
    countyInfoBox
        .append("text")
        .attr("class", "infobox")
        .attr("id", key)
        .attr("x", 10)
        .attr("y", 40 + i * 15);
});
//zoom in animation
var zoom = d3
    .zoom()
    .scaleExtent([1, 20])
    .translateExtent([
        [0, 0],
        [countyMapWidth, countyMapHeight],
    ]) // to lock to edges
    .on("zoom", ({ transform }) => {
        countyView.attr("transform", transform.toString());
        countyView.select(".county-outline").style("stroke-width", 1 / transform.k);
    });

// look up county data by fip code
function fipToCounty(fip) {
    let county = countyFips[fip];

    return countyAccidents[county.state + "-" + county.county_name];
}

function fipToState(fip) {
    return states.features.filter((d) => d.id === fip);
}

function mouseEntersCounty(event) {
    countyInfoBox.style("visibility", "visible");

    let countyData = d3.select(this).datum();
    let county = fipToCounty(countyData.id);
    // update text
    countyName.text(
        countyData.cty_fips === 11001
            ? "D.C"
            : countyFips[countyData.id].county_name + " County"
    );
    if (county != null) {
        Object.keys(countyDetails).forEach((d, i) => {
            countyInfoBox.select(`#${d}`).text(`Num of ${typeNameMapper[d]}: 
                  ${county[d][maxYear - selectedYear]}`);
        });
    }
}

function mouseLeavesCounty(event) {
    countyInfoBox.style("visibility", "hidden");
    if (county != null) {
        Object.keys(countyDetails).forEach((d, i) => {
            countyInfoBox.select(`#${d}`).text(`Num of ${typeNameMapper[d]}: 0`);
        });
    }
}

async function loadTrendData(stateID) {
    trendData = await d3.csv("data/final_trend.csv");
    trendData = trendData.map((obj) =>
        Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (
                    key === "Year" ||
                    key === "Other_CC" ||
                    key === "Total_CC" ||
                    key === "FDH" ||
                    key === "pop" ||
                    key === "stFips"
                ) {
                    return [key, Number(value)];
                }
                return [key, value];
            })
        )
    );
}

// set trend plot y axis scale
function getMinMaxValues(selectedStateTrend) {
    const allCaseNumber = selectedStateTrend.reduce((acc, curr) => {

        const fdhCase = curr.FDH;
        const otherCase = curr.Other_CC;
        const totalCase = curr.Total_CC;
        const pop = curr.pop;

        return [...acc, fdhCase, otherCase, totalCase, pop];
    }, []);

    let minCaseNumber = Math.min(...allCaseNumber);
    let maxCaseNumber = Math.max(...allCaseNumber);

    return { minCaseNum: minCaseNumber, maxCaseNum: maxCaseNumber }; //desctructure assignment
}

async function drawTrendPlot(stateFip) {
    if (!dataIsLoaded3) {
        await loadFips();
        await loadTrendData();
        dataIsLoaded3 = true;
    }

    let stateCode = Number(stateFips[stateFip].stFips);
    let selectedStateTrend = trendData.filter((d) => d.stFips === stateCode);

    selectedStateTrend = selectedStateTrend.sort((a, b) => a.Year - b.Year);

    const { maxCaseNum, minCaseNum } = getMinMaxValues(selectedStateTrend);

    // draw trend plot
    // draw trend plot axis
    var xAxisScaler = d3
        .scaleLinear()
        .domain([minYear, maxYear])
        .range([0, trendInnerWidth]);

    var yAxisScaler = d3
        .scaleLinear()
        .domain([maxCaseNum, minCaseNum])
        .range([0, trendInnerHeight]);

    function getDigit(nb) {
        if (nb === 0) {
            return 1;
        }
        return Math.floor(Math.log10(Math.abs(nb))) + 1;
    }

    const Ydigit = getDigit(maxCaseNum);
    Xaxis.attr(
        "transform",
        `translate(${trendMargin.left},${trendInnerHeight + trendMargin.bottom})`
    )
        .attr("class", "xTrendTicks")
        .call(d3.axisBottom(xAxisScaler).tickFormat(d3.format("")));

    Yaxis.attr(
        "transform",
        `translate(${trendMargin.left},${trendMargin.bottom})`
    )
        .attr("class", "yTrendTicks")
        .call(
            d3
                .axisRight(yAxisScaler)
                .tickSize(0)
                .tickFormat(function (d) {
                    return d;
                })
        );

    // interval between tick and x axis
    let yTickText = d3.selectAll("g.yTrendTicks .tick text");
    yTickText.attr("x", -Ydigit * 8 - 10);
    yTickText.attr("y", 0);

    let xTickText = d3.selectAll("g.xTrendTicks .tick text");
    xTickText.attr("y", 10);

    let alltotalCasePoints = trendPlot.selectAll("circle.tt");
    let alltotalCaseLine = trendPlot.selectAll("line.tt");

    let allotherCasePoints = trendPlot.selectAll("circle.Other_CC"); //3 is padding
    let allotherCaseLine = trendPlot.selectAll("line.Other_CC");

    let allfdhCasePoints = trendPlot.selectAll("circle.FDH");
    let allfdhCaseLine = trendPlot.selectAll("line.FDH");

    let allpopCasePoints = trendPlot.selectAll("circle.pop");
    let allpopCaseLine = trendPlot.selectAll("line.pop");

    // console.log(selectedStateTrend)
    // point for each year - for all cases
    alltotalCasePoints
        .data(selectedStateTrend)
        .join("circle")
        .attr("class", "tt")
        .attr("cx", function (d, i) {
            return (i * trendInnerWidth) / yearInterval;
        })
        .attr("cy", function (d) {
            return yAxisScaler(d.Total_CC) + trendMargin.bottom;
        })
        .attr("r", trendLinePointRadius)
        .style("fill", trendLineColors["Total Childcare"])
        .attr("transform", `translate(${trendMargin.left},${0})`);

    // line for all cases
    alltotalCaseLine
        .data(selectedStateTrend)
        .join("line")
        .attr("class", "tt")
        .attr("x1", (d, i) => (i * trendInnerWidth) / yearInterval)
        .attr("y1", (d, i) => yAxisScaler(d.Total_CC) + trendMargin.bottom)
        .attr("x2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return (i * trendInnerWidth) / yearInterval;
            } else {
                return ((i + 1) * trendInnerWidth) / yearInterval;
            }
        })
        .attr("y2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return yAxisScaler(d.Total_CC) + trendMargin.bottom;
            } else {
                return (
                    yAxisScaler(selectedStateTrend[i + 1].Total_CC) + trendMargin.bottom
                );
            }
        })
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .attr("stroke", trendLineColors["Total Childcare"]);

    // point for each year - for others cases
    allotherCasePoints
        .data(selectedStateTrend)
        .join("circle")
        .attr("class", "Other_CC")
        .attr("cx", function (d, i) {
            return (i * trendInnerWidth) / yearInterval;
        })

        .attr("cy", function (d) {
            return yAxisScaler(d.Other_CC) + trendMargin.bottom;
        })
        .attr("r", trendLinePointRadius)
        .style("fill", trendLineColors["0-4Yrs Population"])
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .style("opacity", 0.5);

    // line for others cases
    allotherCaseLine
        .data(selectedStateTrend)
        .join("line")
        .attr("class", "Other_CC")
        .attr("x1", (d, i) => (i * trendInnerWidth) / yearInterval)
        .attr("y1", (d, i) => yAxisScaler(d.Other_CC) + trendMargin.bottom)
        .attr("x2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return (i * trendInnerWidth) / yearInterval;
            } else {
                return ((i + 1) * trendInnerWidth) / yearInterval;
            }
        })
        .attr("y2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return yAxisScaler(d.Other_CC) + trendMargin.bottom;
            } else {
                return (
                    yAxisScaler(selectedStateTrend[i + 1].Other_CC) + trendMargin.bottom
                );
            }
        })
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .attr("stroke", trendLineColors["0-4Yrs Population"]);

    // point for each year - for fdh cases
    allfdhCasePoints
        .data(selectedStateTrend)
        .join("circle")
        .attr("class", "FDH")
        .attr("cx", function (d, i) {
            return (i * trendInnerWidth) / yearInterval;
        })
        .attr("cy", function (d) {
            return yAxisScaler(d.FDH) + trendMargin.bottom;
        })
        .attr("r", trendLinePointRadius)
        .style("fill", trendLineColors["Family Day Care"])
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .style("opacity", 0.5);

    // line for fdh cases
    allfdhCaseLine
        .data(selectedStateTrend)
        .join("line")
        .attr("class", "FDH")
        .attr("x1", (d, i) => (i * trendInnerWidth) / yearInterval)
        .attr("y1", (d, i) => yAxisScaler(d.FDH) + trendMargin.bottom)
        .attr("x2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return (i * trendInnerWidth) / yearInterval;
            } else {
                return ((i + 1) * trendInnerWidth) / yearInterval;
            }
        })
        .attr("y2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return yAxisScaler(d.FDH) + trendMargin.bottom;
            } else {
                return yAxisScaler(selectedStateTrend[i + 1].FDH) + trendMargin.bottom;
            }
        })
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .attr("stroke", trendLineColors["Family Day Care"]);

    // all population
    allpopCasePoints
        .data(selectedStateTrend)
        .join("circle")
        .attr("class", "pop")
        .attr("cx", function (d, i) {
            return (i * trendInnerWidth) / yearInterval;
        })
        .attr("cy", function (d) {
            return yAxisScaler(d.pop) + trendMargin.bottom;
        })
        .attr("r", trendLinePointRadius)
        .style("fill", "black")
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .style("opacity", 0.5);

    // line for pop cases
    allpopCaseLine
        .data(selectedStateTrend)
        .join("line")
        .attr("class", "pop")
        .attr("x1", (d, i) => (i * trendInnerWidth) / yearInterval)
        .attr("y1", (d, i) => yAxisScaler(d.pop) + trendMargin.bottom)
        .attr("x2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return (i * trendInnerWidth) / yearInterval;
            } else {
                return ((i + 1) * trendInnerWidth) / yearInterval;
            }
        })
        .attr("y2", (d, i, nodes) => {
            if (i === nodes.length - 1) {
                return yAxisScaler(d.pop) + trendMargin.bottom;
            } else {
                return yAxisScaler(selectedStateTrend[i + 1].pop) + trendMargin.bottom;
            }
        })
        .attr("id", (d, i) => d.pop)
        .attr("transform", `translate(${trendMargin.left},${0})`)
        .attr("stroke", "black");
}

// load case number data
async function loadCountyData() {
    //final_county_case

    countyCase = await d3.csv("data/countyCaseData.csv");
    countyCase.forEach((d) => {
        let county = d["State"] + "-" + d["County"];
        let yearIndex = maxYear - Number(d["Year"]);

        if (!(county in countyAccidents)) {
            countyAccidents[county] = {
                name: d["County"],
                state: d["State"],
                Total_CC: Array(yearInterval).fill(0),
                Other_CC: Array(yearInterval).fill(0),
                FDH: Array(yearInterval).fill(0),
            };
        }
        countyAccidents[county]["Total_CC"][yearIndex] = Number(d["Total_CC"]);
        countyAccidents[county]["Other_CC"][yearIndex] = Number(d["Other_CC"]);
        countyAccidents[county]["FDH"][yearIndex] = Number(d["FDH"]);
    });
}

// draw county map plot
async function loadCountyTopoJson() {
    us = await d3.json("data/us.json");
    // counties json does not provide these states' map value
    let filteredStates = ["02", "2", "15", "60", "66", "69", "72", "74", "78"];

    us.objects.states.geometries = us.objects.states.geometries.filter(
        (d) => filteredStates.indexOf(d.id.toString()) === -1
    ); // find index, if not found filteredStates, return -1, then filter those index=-1
    // console.log(us.objects.states.geometries);
    states = topojson.feature(us, us.objects.states);
    statesMesh = topojson.mesh(us, us.objects.states);
    counties = topojson.feature(us, us.objects.counties);
    countiesMesh = topojson.mesh(us, us.objects.counties);
    projection1 = d3
        .geoAlbers()
        .fitSize([countyMapWidth, countyMapHeight], states);
    path = d3.geoPath().projection(projection1);
    countyOutlines = countyView
        .append("path")
        .datum(countiesMesh)
        .attr("class", "county-outline")
        .attr("d", path);
}

// fip number and state mapping
async function loadFips() {
    let data = await d3.csv("data/state_fips.csv");
    data.forEach((d) => {
        stateFips[d.stFips] = d;
    });
    // console.log(data)
    data = await d3.csv("data/counties_fips.csv");
    data.forEach((d) => {
        countyFips[d.cty_fips] = d;
    });
}

// fill color into county plot
async function drawCountyPlot(stateFip, year, caseType) {
    // only load data files once
    if (!dataIsLoaded2) {
        await loadCountyData();
        await loadCountyTopoJson();
        await loadFips();
        dataIsLoaded2 = true;
    }

    // select year, state, and counties
    selectedYear = year;
    let yearIndex = maxYear - year;
    let selectedState = fipToState(stateFip);
    let state = stateFips[stateFip];
    let selectedCounties = counties.features.filter(
        (d) => d.id >= stateFip * 1000 && d.id < stateFip * 1000 + 1000
    );
    let countyData = selectedCounties.map((d) => fipToCounty(d.id));
    const introTextLocator = d3.select("#childcare-Desert-intro");

    introTextLocator.html(
        `${year} Childcare Desert in <span style="color:#CC5803">${state.state_name}</span> with ${typeNameMapper[caseType]}`
    );

    /* COUNTY MAP */
    countyView
        .selectAll("path.county")
        .data(selectedCounties)
        .join("path")
        .attr("class", "county")
        .attr("id", (d) => "county" + d.id)
        .attr("d", path)
        .attr("fill", (d) => {
            let county = fipToCounty(d.id);
            return county == null
                ? "darkgray"
                : colorScaleCounty(county[caseType][yearIndex]);
        })
        .lower()
        .on("mouseover", mouseEntersCounty)
        .on("mouseout", mouseLeavesCounty);

    // center and zoom onto the selected state
    // if the state is clicked last time, then freeze the transform animation if the same state is clicked again
    if (lastSelectedStateID === stateFip) {
        countyView.call(zoom.transform, d3.zoomIdentity);

        let bounds = path.bounds(selectedState[0].geometry);
        let dx = bounds[1][0] - bounds[0][0];
        let dy = bounds[1][1] - bounds[0][1];
        let x = (bounds[0][0] + bounds[1][0]) / 2;
        let y = (bounds[0][1] + bounds[1][1]) / 2;
        let scale = Math.max(
            1,
            Math.min(10, 0.9 / Math.max(dx / countyMapWidth, dy / countyMapHeight))
        );
        let translate = [
            countyMapWidth / 2 - x * scale,
            countyMapHeight / 2 - y * scale,
        ];
        let newTransform = d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale);
        countyView.call(zoom.transform, newTransform);
    } else {
        countyView.call(zoom.transform, d3.zoomIdentity);

        let bounds = path.bounds(selectedState[0].geometry);
        let dx = bounds[1][0] - bounds[0][0];
        let dy = bounds[1][1] - bounds[0][1];
        let x = (bounds[0][0] + bounds[1][0]) / 2;
        let y = (bounds[0][1] + bounds[1][1]) / 2;
        let scale = Math.max(1, Math.min(10, 0.9 / Math.max(dx / countyMapWidth, dy / countyMapHeight))
        );
        let translate = [
            countyMapWidth / 2 - x * scale,
            countyMapHeight / 2 - y * scale,
        ];
        let newTransform = d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale);
        countyView.transition().duration(1000).call(zoom.transform, newTransform);
    }

    lastSelectedStateID = stateFip; // update the state been clicked
}

// default state setting
drawStatePlot(defaultYear);
drawCountyPlot(36, defaultYear, "Total_CC");
drawTrendPlot(36);
