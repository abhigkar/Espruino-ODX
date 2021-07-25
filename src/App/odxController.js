// controller for BLE services

window.addEventListener("onSamplingStarted", function (evt) {
	$("#btnGenerateCSV").prop('disabled', evt.detail);
}, false);

/// BLE things, mainly for debug
var device, server, odxService, odxDataCharacteristic, odxCmdCharacteristic, odxInfoCharacteristic;
//data is to receive pulse data
//cmd is to end commands
//infir is read infor from device
var vis = [], ir = [], ps1 = [], ps2 = [];

let chList = 0;
var sensorSettings;

function connect() {
	disconnect();

	navigator.bluetooth.requestDevice({ optionalServices: ['f8b23a4d-89ad-4220-8c9f-d81756009f0e'], acceptAllDevices: true })
		.then(d => {
			device = d;
			console.debug('device:', device)
			$('#devNameSpan').text(device.name);
			return device.gatt.connect()
		})

		.then(s => {
			server = s
			console.debug('server:', server)
			// get magnetometer service & characteristic:
			s.getPrimaryService('f8b23a4d-89ad-4220-8c9f-d81756009f0e')
				.then(service => {
					console.debug('got pulseSerice:', service)
					odxService = service
					return odxService.getCharacteristics();
				})
				.then(chs => {
					 console.log('characteristics:', chs)
					
					
					 for (let ix = 0; ix < chs.length; ix++) {
                        const ch = chs[ix];
                        if (ch.uuid == 'f8b23a4d-89ad-4220-8c9f-d81756009f0a') { //Data
                            // Puck or Bangle magnetometer
                            odxDataCharacteristic = ch
                            ch.addEventListener('characteristicvaluechanged', pulseChanged)
                            ch.startNotifications()
                            window.dispatchEvent(new CustomEvent("onODXConnect"));
                        }
                        if (ch.uuid == 'f8b23a4d-89ad-4220-8c9f-d81756009f0e') { //command
                            odxCmdCharacteristic = ch
                        }
						if (ch.uuid == 'f8b23a4d-89ad-4220-8c9f-d81756009f0b') { //info
                            odxInfoCharacteristic = ch
							ch.addEventListener('characteristicvaluechanged',infoHandler);
                            ch.startNotifications()
                        }
                    }
					setTimeout(getSettings,1000);
				})
		})
}

function infoHandler(evt){
	sensorSettings = new Int8Array(evt.target.value.buffer);
	let cl = sensorSettings[0];//em
	$("#rdPsChannel").prop("checked", cl & 1);
	if(cl & 1) toggleCollapsible($("#rdPsChannel"));
	$("#rdAlsChannel").prop("checked", cl & 2);
	if(cl & 2) toggleCollapsible($("#rdAlsChannel"));
	chList = cl;	
	$("#ddlSampleRate").val(sensorSettings[1]);//mr
	$("#rdPSDiode").prop("checked", sensorSettings[2] == 3);//ps diode
	$("#ddlPSADCGain").val(sensorSettings[3]);//ps gain
	$("#rdHighSigPS").prop("checked", sensorSettings[4] == 1);//hspsr
	$("#rdALSDiode").prop("checked", sensorSettings[5] == 3);//ird
	$("#ddlALSIrADCGain").val(sensorSettings[6]);//alsvisgn
	$("#rdHighSigALSIr").prop("checked", sensorSettings[7] == 1);//hsvr
	$("#ddlALSIrADCGain").val(sensorSettings[8]);//alsirgn
	$("#rdHighSigALSVis").prop("checked", sensorSettings[9] == 1);//hsirr
	$("#rdHighResPS").prop("checked", sensorSettings[10] == 1);//hrps
	$("#rdHighResALSVis").prop("checked", sensorSettings[11] == 1);//hrvis
	$("#rdHighResALSIR").prop("checked", sensorSettings[12] == 1);//hrir
	
}
function disconnect() {
	server = server && server.disconnect();
	device = undefined;
	server = undefined;
	odxService = undefined;
	odxDataCharacteristic = undefined;
	odxCmdCharacteristic = undefined;
	odxInfoCharacteristic = undefined;
	$('#devNameSpan').text("No device connected");
	window.dispatchEvent(new CustomEvent("onODXDisconnect"));
}

var startTime, endTime;
let elaspedTime=0;

function start() {
  startTime = performance.now();
};

function end() {
	endTime = performance.now();
	var timeDiff = endTime - startTime; //in ms 
	// strip the ms 
	timeDiff /= 1; 
	
	// get seconds 
	var milliseconds = Math.round(timeDiff);
	elaspedTime += milliseconds;
	console.log(milliseconds + " msec");
  }
 start() 

function pulseChanged(evt) {
	end();
	var raw = evt.target.value
	var pulseData = new Int16Array(raw.buffer)
	console.log(pulseData);
	vis.push(pulseData[0]);
	ir.push(pulseData[1]);
	ps1.push(pulseData[2]);
	ps2.push(pulseData[3]);
	addSensorDataToStorage(pulseData,elaspedTime);
	//start();
}


function startMeasurement(){
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x0D;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd);
		var evt = new CustomEvent("onSamplingStarted", { detail: true });
		window.dispatchEvent(evt);
		$("#btnPause").show();
		$("#btnStart").hide();
	}
};
function stopMeasurement(){
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x0E;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd);
		var evt = new CustomEvent("onSamplingStarted", { detail: false });
		window.dispatchEvent(evt);
		$("#btnPause").hide();
		$("#btnStart").show();
	}
};

function Sampling(e) {
	let start = e.value;
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x01;
		cmd[1] = start==1 ? 0x01 : 0x00;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd)
		window.dispatchEvent(new CustomEvent("onSamplingStarted", { detail: start }));
		document.getElementById('btnSampling').innerText = (e.value == 0) ? 'Start sampling' : 'Stop sampling';
		e.value = 1 - start;
	}
}

function setPSADCGain(e){ //odx_cmd 0x01
	let gain = e.value;
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x01;
		cmd[1] = gain;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd);
	}
	
};
function setALSVisADCGain(e){//odx_cmd 0x02
	let gain = e.value;
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x02;
		cmd[1] = gain;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd);
	}
};

function setALSIRADCGain(e){//odx_cmd 0x03
	let gain = e.value;
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x03;
		cmd[1] = gain;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd);
	}
};

function selectDiode(e){// odx_cmd 0x05, 1=PS; >1 IR
	let type = $(e).val();
	let value = $(e).prop("checked") ? 0x03 :0x00; //3 = large, 0 = Small
	if(type==1)//PS
	{
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x05,type,value])); 
	}
	else if(type==2){//ALS
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x05,type,value]));
	}
};

function setHighResolution(e){// type ps, vis ir
    let type = $(e).val();
	let state = $(e).prop("checked");
	if(type==1)
	{
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x06,state]));//odx_cmd 0x06
	}
	else if(type==2){
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x07,state]));//odx_cmd 0x07
	}
	else if(type==3){
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x08,state]));//odx_cmd 0x08
	}
}

function setHighSignalRange(e){// type ps, vis ir
	let type = $(e).val();
	let state = $(e).prop("checked");
	if(type==1)
	{
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x09,state]));//odx_cmd 0x09
	}
	else if(type==2){
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x0A,state]));//odx_cmd 0x0A
	}
	else if(type==3){
		odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x0B,state]));//odx_cmd 0x0B
	}
}

function setPSChannel(e){//odx_cmd 0x0B PA, ALS, PSALS : FORCE, AUTO, PAUSE
	let psChecked = $("#rdPsChannel").prop("checked");
	
	if(psChecked)
		chList = chList | $("#rdPsChannel").val();
	else
		chList = chList & ~$("#rdPsChannel").val();
	
	odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x0C,chList]));
}

function setALSChannel(e){//odx_cmd 0x0B PA, ALS, PSALS : FORCE, AUTO, PAUSE
	let alsChecked = $("#rdAlsChannel").prop("checked");
	
	if(alsChecked)
		chList = chList | $("#rdAlsChannel").val();
	else
		chList = chList & ~$("#rdAlsChannel").val();
	
	odxCmdCharacteristic.writeValueWithoutResponse(new Int8Array([0x0C,chList]));
}

function changeSampleRate(e){
	let rate = e.value;
	console.log(rate)
	if (device) {
		let cmd = new Int8Array(2);
		cmd[0] = 0x04;
		cmd[1] = rate;
		odxCmdCharacteristic.writeValueWithoutResponse(cmd)
	}
}


function getSettings(){
	let cmd = new Int8Array(2);
	cmd[0] = 0x10;
	odxCmdCharacteristic.writeValueWithoutResponse(cmd)
}
function saveSettings(){
	let cmd = new Int8Array(2);
	cmd[0] = 0x11;
	odxCmdCharacteristic.writeValueWithoutResponse(cmd)
}