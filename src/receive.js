// DOM elements
const pulseGraphDiv = document.getElementById('pulseGraphDiv')
/// BLE things, mainly for debug
var device, server, pulseService, pulseCharacteristic
var vis=[], ir=[], pData=[];

function pulseChanged(evt)
{
	var raw = evt.target.value
    var pulseData = new Int16Array(raw.buffer)
	console.log(pulseData);
    vis.push(pulseData[0]);
	ir.push(pulseData[1]);
	
}

function ControlLed(ledOn){
	let cmd = new Int8Array(2);
	cmd[0] = 0x02;
	cmd[1] = ledOn ? 0x01 : 0x00;
	pulseCharacteristic.writeValue(cmd)
	//pulseCharacteristic.writeValue(Uint8Array.of(start))
}

function Sampling(start)
{
	let cmd = new Int8Array(2);
	cmd[0] = 0x01;
	cmd[1] = start ? 0x01 : 0x00;
	pulseCharacteristic.writeValue(cmd)
}
/// the function executing at requestAnimationFrame.
/// otherwise 80Hz update rate would lock up my browser (I guess depends on screen refresh rate)
function step() {
	if (vis.length) {
        Plotly.extendTraces(
            pulseGraphDiv,
            {
                y: [vis, ir],
            },
            [0, 1]
        );
        vis.length = 0;
		ir.length = 0;
    }
    window.requestAnimationFrame(step)
}

function disconnect() {
    server = server && server.disconnect()
    device = undefined
    server = undefined
    pulseService = undefined
    pulseCharacteristic = undefined
}

/// Connect to the Puck
function doIt() {
    disconnect();

    navigator.bluetooth.requestDevice({ optionalServices: ['f8b23a4d-89ad-4220-8c9f-d81756009f0e'], acceptAllDevices: true })
        .then(d => {
            device = d;
            console.debug('device:', device)
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
	Plotly.newPlot(pulseGraphDiv, [{
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#00f' },
        name: 'Vis'
    }, {
        y: [],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#0f0' },
        name: 'IR'
    }], { title: 'Pulse Data' });
}
window.requestAnimationFrame(step)
clearIt()