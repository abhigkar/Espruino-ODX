// DOM elements
const irDiv = document.getElementById('irDiv')
const visDiv = document.getElementById('visDiv')
const ps1Div = document.getElementById('ps1Div')
const ps2Div = document.getElementById('ps2Div')
const ps3Div = document.getElementById('ps3Div')
const devNameSpan = document.getElementById('devNameSpan')

/// BLE things, mainly for debug
var device, server, pulseService, pulseCharacteristic
var vis=[], ir=[], ps1=[], ps2=[], ps3=[];

var isFirstConnect = true;

function bit_test(num, bit){
    return ((num>>bit) % 2 != 0)
}

function bit_set(num, bit){
    return num | 1<<bit;
}

function bit_clear(num, bit){
    return num & ~(1<<bit);
}

function bit_toggle(num, bit){
    return bit_test(num, bit) ? bit_clear(num, bit) : bit_set(num, bit);
}

function pulseChanged(evt)
{
	var raw = evt.target.value
    var pulseData = new Int16Array(raw.buffer)
	console.log(pulseData);

	vis.push(pulseData[0]);
	ir.push(pulseData[1]);
	ps1.push(pulseData[2]);
	ps2.push(pulseData[3]);
	ps3.push(pulseData[4]);
	if(isFirstConnect){
		setPhotodetectorSelection(pulseData);
		isFirstConnect=false;
	}

}

function ControlLed(ledOn){
	if(device){
		let cmd = new Int8Array(2);
		cmd[0] = 0x02;
		cmd[1] = ledOn ? 0x01 : 0x00;
		pulseCharacteristic.writeValue(cmd)
		//pulseCharacteristic.writeValue(Uint8Array.of(start))
	}
}

function Sampling(start)
{
	if(device){
		let cmd = new Int8Array(2);
		cmd[0] = 0x01;
		cmd[1] = start ? 0x01 : 0x00;
		pulseCharacteristic.writeValue(cmd)
	}
}

function setPhotodetectorSelection(data){
	document.querySelector( 'input[id="vison"]').checked = data[0] > 0 ;
	document.querySelector( 'input[id="visoff"]').checked = !(data[0] > 0);
	
	document.querySelector( 'input[id="iron"]').checked = data[1] > 0 ;
	document.querySelector( 'input[id="iroff"]').checked = !(data[1] > 0);
	
	document.querySelector( 'input[id="ps1on"]').checked = data[2] > 0 ;
	document.querySelector( 'input[id="ps1off"]').checked = !(data[2] > 0);
	
	document.querySelector( 'input[id="ps2on"]').checked = data[3] > 0 ;
	document.querySelector( 'input[id="ps2off"]').checked = !(data[3] > 0);
	
	document.querySelector( 'input[id="ps3on"]').checked = data[4] > 0 ;
	document.querySelector( 'input[id="ps3off"]').checked = !(data[4] > 0);
		
}

function sendPhotodetectorSelection(){
	if(device){
		var elevis = document.querySelector( 'input[name="vis"]:checked').value;  
		var eleir = document.querySelector( 'input[name="ir"]:checked').value;  
		var eleps1 = document.querySelector( 'input[name="ps1"]:checked').value;
		var eleps2 = document.querySelector( 'input[name="ps2"]:checked').value; 
		var eleps3 = document.querySelector( 'input[name="ps3"]:checked').value; 

		let cmdBits = 31;
		if(elevis==1)	cmdBits = bit_set(cmdBits,0); else cmdBits = bit_clear(cmdBits,0);
		if(eleir==1) cmdBits = bit_set(cmdBits,1); else cmdBits = bit_clear(cmdBits,1);
		if(eleps1==1) cmdBits = bit_set(cmdBits,2); else cmdBits = bit_clear(cmdBits,2);
		if(eleps2==1) cmdBits = bit_set(cmdBits,3); else cmdBits = bit_clear(cmdBits,3);
		if(eleps3==1) cmdBits = bit_set(cmdBits,4); else cmdBits = bit_clear(cmdBits,4);
		
		
		let cmd = new Int8Array(2);
		cmd[0] = 0x03;
		cmd[1] = cmdBits;
		console.log(cmdBits.toString(2));
		pulseCharacteristic.writeValue(cmd)
	}
}

/// the function executing at requestAnimationFrame.
/// otherwise 80Hz update rate would lock up my browser (I guess depends on screen refresh rate)
var cnt = 0;
function step() {
	if(vis.length){
		 Plotly.extendTraces(
            visDiv,
            {
                y: [vis],
            },
            [0]
        );
        vis.length = 0;
	}
	if(ir.length){
		 Plotly.extendTraces(
            irDiv,
            {
                y: [ir],
            },
            [0]
        );
        ir.length = 0;
	}
	if(ps1.length){
		 Plotly.extendTraces(
            ps1Div,
            {
                y: [ps1],
            },
            [0]
        );
        ps1.length = 0;
	}
	if(ps2.length){
		 Plotly.extendTraces(
            ps2Div,
            {
                y: [ps2],
            },
            [0]
        );
        ps2.length = 0;
	}
	if(ps3.length){
		 Plotly.extendTraces(
            ps3Div,
            {
                y: [ps3],
            },
            [0]
        );
        ps3.length = 0;
	}
	
    window.requestAnimationFrame(step)
	cnt++;
	if(cnt > 500 && 1!=1) {
		Plotly.relayout(ps1Div,{
			xaxis: {
				range: [cnt-500,cnt]
			}
		});
		Plotly.relayout(ps2Div,{
			xaxis: {
				range: [cnt-500,cnt]
			}
		});
		Plotly.relayout(ps3Div,{
			xaxis: {
				range: [cnt-500,cnt]
			}
		});
		Plotly.relayout(irDiv,{
			xaxis: {
				range: [cnt-500,cnt]
			}
		});
		Plotly.relayout(visDiv,{
			xaxis: {
				range: [cnt-500,cnt]
			}
		});
	}
}

function disconnect() {
    server = server && server.disconnect()
    device = undefined
    server = undefined
    pulseService = undefined
    pulseCharacteristic = undefined
	devNameSpan.innerText = "";
}

/// Connect to the Puck
function doIt() {
    disconnect();

    navigator.bluetooth.requestDevice({ optionalServices: ['f8b23a4d-89ad-4220-8c9f-d81756009f0e'], acceptAllDevices: true })
        .then(d => {
            device = d;
            console.debug('device:', device)
			devNameSpan.innerText = device.name;
            return device.gatt.connect()
        })
		
        .then(s => {
            server = s
            console.debug('server:', server)
			// get magnetometer service & characteristic:
            s.getPrimaryService('f8b23a4d-89ad-4220-8c9f-d81756009f0e')
                .then(pulseSrv => {
					console.debug('got pulseSerice:', pulseSrv)
                    pulseService = pulseSrv
                    return pulseService.getCharacteristic('f8b23a4d-89ad-4220-8c9f-d81756009f0e')
                })
                .then(pulseChs => {
					console.debug('got pulseCharacteristic:', pulseChs)
                    pulseCharacteristic = pulseChs
                    // add event listener to pulse characteristic
                    pulseChs.addEventListener('characteristicvaluechanged', pulseChanged)
                    pulseChs.startNotifications()
                })
        })
}

/// Create the initial graph & clear it
function clearIt() {
	Plotly.newPlot(visDiv, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#00f' },
        name: 'Vis'
    }],{ title: 'Visual Light' });
	Plotly.newPlot(irDiv, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#f00' },
        name: 'IR'
    }],{ title: 'Infra red Light' });
	
	Plotly.newPlot(ps1Div, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#f00' },
        name: 'PS1'
    }],{ title: 'Proximity 1' });
	Plotly.newPlot(ps2Div, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#0f0' },
        name: 'PS2'
    }],{ title: 'Proximity 2' });
	Plotly.newPlot(ps3Div, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#00f' },
        name: 'PS3'
    }],{ title: 'Proximity 3' });
}
window.requestAnimationFrame(step)
clearIt()