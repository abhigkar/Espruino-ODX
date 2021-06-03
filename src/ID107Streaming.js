// upload this to the ID107

var i2cAddr = '0x5a';

var i2c = I2C1;
i2c.setup({ sda: 10, scl: 9 });

var intervalId = 0;
var debug = true;
let sensorSetting = 31;

const l = (msg) => {
  if (debug) console.log(msg);
};

function getReg(reg, len) {
  if (len == undefined) len = 1;
  i2c.writeTo(i2cAddr, reg);
  return i2c.readFrom(i2cAddr, len);
}

function setReg(reg, val) {
  i2c.writeTo(i2cAddr, [reg, val]);
}

function readParam(addr) {
  i2c.writeTo(i2cAddr, [0x18, (0x80 | addr)]);//QUERY
  return getReg(0x2E, 1);//PARAM_RD
}

function writeParam(addr, val) {
  setReg(0x17, val);//PARAM_WR
  write_cmd(0xA0 | addr);
}

function write_cmd(cmd) {
  let old_value = getReg(0x20, 1);//REG_RESPONSE
  setReg(0x18, cmd);//COMMAND
  if (cmd == 0x01) {
    return;
  }
  let i = 0;
  var timeout = 25;
  while (--timeout && getReg(0x20, 1) == old_value);
}

function softResetDevice() {
  setReg(0x18, 0x01);
}

function getDeviceId() {
  let partId, revId, seqId;
  partId = getReg(0x00, 1).toString(10);//PART_ID
  revId = getReg(0x01, 1).toString(10);//REV_ID
  seqId = getReg(0x02, 1).toString(10);//SEQ_ID
  console.log("Part Id", partId, "Rev Id", revId, "Seq Id", seqId);
}

function isPresent() {
  var data = getReg(0x00, 1);
  return data[0] == 0x42;
}

function initPulseSensor() {
  setReg(0x07, 0x17);//HW_KEY
  setReg(0x03, 0x03);//INT_CFG turn on interrupts
  setReg(0x04, 0x0F);//IRQ_ENABLE turn on interrupt on PS12 JJ
  setReg(0x06, 0x01);//IRQ_MODE2 interrupt on ps3 measurement
  setReg(0x05, 0x0F);//IRQ_MODE1 interrupt on ps2 AND PS1 measurement
  setReg(0x08, 0x84);//MEAS_RATE see datasheet -- every 10ms
  setReg(0x09, 0x08);//ALS_RATE see datasheet ---- one measurement
  setReg(0x0A, 0x08);//PS_RATE see datasheet --every time the device wakes up
  // Current setting for LEDs pulsed while taking readings
  // PS_LED21  Setting for LEDs 1 & 2. LED 2 is high nibble
  // each LED has 16 possible (0-F in hex) possible settings
  setReg(0x10, 0x02);//PS_LED3
  setReg(0x0F, 0x00);//PS_LED21 this powers off the green leds of the ID107HR
  console.log("PS_LED21 = ", getReg(0x0F, 1)[0].toString(16));//PS_LED21
  console.log("CHLIST = ", readParam(0x01)[0].toString(16));//PARAM_CH_LIST
  writeParam(0x01, 0x77);//PARAM_CH_LIST all measurements on
  // increasing PARAM_PS_ADC_GAIN will increase the LED on time and ADC window
  // you will see increase in brightness of visible LED's, ADC output, & noise
  // datasheet warns not to go beyond 4 because chip or LEDs may be damaged
  writeParam(0x0B, 0x00);//PARAM_PS_ADC_GAIN
  // You can select which LEDs are energized for each reading.
  // The settings below turn on only the LED that "normally" would be read
  // ie LED1 is pulsed and read first, then LED2 is pulsed and read etc.
  writeParam(0x02, 0x21);//PARAM_PSLED12_SELECT 21 = LED 2 & LED 1 (red) resp.
  //there is no led 3  pulse.writeParam(PulsePlug::PARAM_PSLED3_SELECT, 0x04);   // 4 = LED 3 only
  // Sensors for reading the three LEDs
  // 0x03: Large IR Photodiode
  // 0x02: Visible Photodiode - cannot be read with LEDs on - just for ambient measurement
  // 0x00: Small IR Photodiode
  writeParam(0x07, 0x03);// PARAM_PS1_ADCMUX PS1 photodiode select
  writeParam(0x08, 0x03);// PARAM_PS2_ADCMUX PS2 photodiode select
  writeParam(0x09, 0x03);// PARAM_PS3_ADCMUX PS3 photodiode select

  writeParam(0x0A, 0b01110000);// PARAM_PS_ADC_COUNTER B01110000 is default

  setReg(0x18, 0b00001111);     //  command, PSALS_AUTO_Cmd starts an autonomous read loop

  console.log("CHIP_STAT= ", getReg(0x30, 1)[0].toString(16));//CHIP_STAT
}



function getALSData() {
  return getReg(0x22, 2);
}

function getIRData() {
  return getReg(0x24, 2);
}

function getPS1Data() {
  return getReg(0x26, 2);
}
function getPS2Data() {
  return getReg(0x28, 2);
}
function getPS3Data() {
  return getReg(0x2A, 2);
}

function getAllReadings() {
  return getReg(0x22, 10);
}

function getSensorData() {
  let data = new Int16Array(2);
  let visLOW = getReg(0x22, 1);//ALS_VIS_DATA0
  let visHIGH = getReg(0x23, 1);//ALS_VIS_DATA01

  let irLOW = getReg(0x24, 1);//ALS_IR_DATA0
  let irHIGH = getReg(0x25, 1);//ALS_IR_DATA1

  data[0] = (visHIGH << 8) | visLOW;
  data[1] = (irHIGH << 8) | irLOW;

  //let od_vis=-0.396*Math.log(test_vis)+3.1196;
  //let od_ir=-0.344*Math.log(test_ir)+3.3413;

  //return 0.5*(od_vreset()is+od_ir);
  return new Int16Array(data).buffer;
}

function getSensorDataX() {
  let test_vis = getReg(0x22, 1)[0] + 256 * getReg(0x23, 1)[0];//ALS_VIS_DATA0/1
  let test_ir = getReg(0x24, 1)[0] + 256 * getReg(0x25, 1)[0];//ALS_IR_DATA0/1

  let od_vis = -0.396 * Math.log(test_vis) + 3.1196;
  let od_ir = -0.344 * Math.log(test_ir) + 3.3413;

  //return 0.5*(od_vreset()is+od_ir);
  return new Int16Array([test_vis, test_ir]);
}

function ledOff() {
  D18.reset();
  setReg(0x0F, 0x00);//PS_LED21
}

function ledOn() {
  D18.set();
  setReg(0x0F, 0x77);//PS_LED21
}

function startSampling(answer) {
  if (answer == 1) {
    if (intervalId <= 0) {
      intervalId = setInterval(updatePulseData, 10);
      console.log("Timer setup", intervalId);
    }
  }
  else {
    if (intervalId > 0) {
      clearInterval(intervalId);
      console.log("Clearing the timer");
      intervalId = 0;
    }
  }
}

function setPhotoDioad(setting) {//000XXXXX 1st-vis, 2nd-ir, 3:5-ps1:ps3
  sensorSetting = setting;
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
  });
}

function executeCommand(cmd, arg) {
  l(cmd)
  l(arg);
  switch (cmd) {
    case 1: //control command for sampling
      startSampling(arg);
      break;
    case 2: //control command for led
      if (arg == 1) ledOn(); else ledOff();
      break;
    case 3:// photo dioad 
      setPhotoDioad(arg);
      break;
  }
}

function onInit() {
  initPulseSensor();
  setTimeout(() => {
    // declare the services
    NRF.setServices({
      'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
        'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
          notify: true,
          writable: true,
          value: [getPulseData()],
          onWrite: function (evt) {
            var cmd = evt.data[0]; ///255??
            var arg = evt.data[1];
            executeCommand(cmd, arg);
          }
        }
      }
    });
  }, 2000);
}


let resetCounter = 0;
function getPulseData() {
  resetCounter++;
  if (resetCounter > 360) { resetCounter = 0; }
  if (resetCounter % 10 == 0) E.kickWatchdog();

  let data = new Int8Array(10);
  if (sensorSetting & 1) data.set(getALSData(), 0);
  if (sensorSetting & 2) data.set(getIRData(), 2);
  if (sensorSetting & 4) data.set(getPS1Data(), 4);
  if (sensorSetting & 8) data.set(getPS2Data(), 6);
  if (sensorSetting & 16) data.set(getPS3Data(), 8);

  return data;
}


NRF.on('disconnect', function(reason) {
  if (intervalId > 0) {
      clearInterval(intervalId);
      console.log("Clearing the timer");
      intervalId = 0;
    }
  ledOff();
});