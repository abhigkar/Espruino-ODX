// DOM elements
const pulseGraphDiv = document.getElementById('pulseGraphDiv')

/// BLE things, mainly for debug
var device, server, pulseService, pulseCharacteristic
var pData=[];

function pulseChanged(evt)
{
	var raw = evt.target.value
    var pulseData = new Int8Array(raw.buffer)
    pData.push(pulseData[0]);
}
function Sampling(start)
{
	pulseCharacteristic.writeValue(Uint8Array.of(start))
}
/// the function executing at requestAnimationFrame.
/// otherwise 80Hz update rate would lock up my browser (I guess depends on screen refresh rate)
function step() {
	if (pData.length) {
        Plotly.extendTraces(
            pulseGraphDiv,
            {
                y: [pData],
            },
            [0]
        );
        pData.length = 0;
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
        name: 'x'
    }], { title: 'Pulse Data' });
}
window.requestAnimationFrame(step)
clearIt()
