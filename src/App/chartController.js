//some custom eventing

window.addEventListener("onSamplingStarted", function (evt) {
	document.querySelector("#btnGenerateCSV").disabled = evt.detail == 1
}, false);

window.addEventListener("onODXConnect", function (evt) {
	$("#btnDisconnect").show();
	$("#btnConnect").hide();
	$(".notConnected").hide();
	$(".connected").show();
	$("#btnGenerateCSV").prop('disabled', false);
	$("#btnPause").hide();
}, false);

window.addEventListener("onODXDisconnect", function (evt) {
	$("#btnConnect").show();
	$("#btnDisconnect").hide();
	$(".notConnected").show();
	$(".connected").hide();
	$("#btnGenerateCSV").prop('disabled', true);
	toggleCollapsible($("#rdPsChannel"));
	toggleCollapsible($("#rdAlsChannel"));
}, false);
	
	
//Dispatch an event


// DOM elements
const irDiv = document.getElementById('irDiv')
const visDiv = document.getElementById('visDiv')
const ps1Div = document.getElementById('ps1Div')
const ps2Div = document.getElementById('ps2Div')

/// the function executing at requestAnimationFrame.
/// otherwise 80Hz update rate would lock up my browser (I guess depends on screen refresh rate)
var cnt = 0;
function step() {
	if (vis.length) {
		Plotly.extendTraces(
			visDiv,
			{
				y: [vis],
			},
			[0]
		);
		vis.length = 0;
	}
	if (ir.length) {
		Plotly.extendTraces(
			irDiv,
			{
				y: [ir],
			},
			[0]
		);
		ir.length = 0;
	}
	if (ps1.length) {
		Plotly.extendTraces(
			ps1Div,
			{
				y: [ps1],
			},
			[0]
		);
		ps1.length = 0;
	}
	if (ps2.length) {
		Plotly.extendTraces(
			ps2Div,
			{
				y: [ps2],
			},
			[0]
		);
		ps2.length = 0;
	}

	window.requestAnimationFrame(step)
	cnt++;
	if (cnt > 500 && 1 != 1) {
		Plotly.relayout(ps1Div, {
			xaxis: {
				range: [cnt - 500, cnt]
			}
		});
		Plotly.relayout(ps2Div, {
			xaxis: {
				range: [cnt - 500, cnt]
			}
		});
		Plotly.relayout(irDiv, {
			xaxis: {
				range: [cnt - 500, cnt]
			}
		});
		Plotly.relayout(visDiv, {
			xaxis: {
				range: [cnt - 500, cnt]
			}
		});
	}
}



/// Connect to the Puck


/// Create the initial graph & clear it
function clearIt() {
	Plotly.newPlot(visDiv, [{
		y: [],
		type: 'scattergl',
		mode: 'lines',
		line: { color: '#00f' },
		name: 'Vis'
	}], { title: 'Visual Light' });
	Plotly.newPlot(irDiv, [{
		y: [],
		type: 'scattergl',
		mode: 'lines',
		line: { color: '#f00' },
		name: 'IR'
	}], { title: 'Infra red Light' });

	Plotly.newPlot(ps1Div, [{
		y: [],
		type: 'scattergl',
		mode: 'lines',
		line: { color: '#f00' },
		name: 'PS1'
	}], { title: 'Proximity 1' });
	Plotly.newPlot(ps2Div, [{
		y: [],
		type: 'scattergl',
		mode: 'lines',
		line: { color: '#0f0' },
		name: 'PS2'
	}], { title: 'Proximity 2' });
}
window.requestAnimationFrame(step)
clearIt()