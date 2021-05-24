// upload this to the ID107

function start(answer)
{
    console.log(answer);
	if(answer==1){
      batteryInterval = setInterval(updatePulseData, 10);
    }
    else{
		clearInterval(batteryInterval);
      batteryInterval=0;
    }
}

function updatePulseData() {
  NRF.updateServices({
    'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
      'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
        notify: true,
        readable: true,
        value: [getPulseData()]
      }
    }
  })
}

function onInit() {
  // on connect / disconnect blink the green / red LED turn on / off the magnetometer
  //NRF.on('connect', function() {Puck.magOn(magRate); digitalPulse(LED2, 1, 100)})
  //NRF.on('disconnect', function() {Puck.magOff(); digitalPulse(LED1, 1, 100)})

  // declare the services
  NRF.setServices({
    // Battery level service
    'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
      'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
        notify: true,
		writable : true,
        value: [getPulseData()],
		onWrite : function(evt) {
			var n = evt.data[0] / 255;
			start(evt.data[0]);
            console.log(evt.data[0]);
		  }
      }
    }
  })
  batteryInterval = setInterval(updatePulseData, 10);
}

function getPulseData()
{
	return generateSampleData();
}
let angle=0;
let amplitude=10;
function generateSampleData()
{
    angle++;
	if(angle>360){ angle=0;}
    if(angle%10==0)E.kickWatchdog();
    //console.log (Math.sin(angle * (Math.PI/180))*amplitude);
	return (Math.sin(angle * (Math.PI/180))*amplitude);	
}