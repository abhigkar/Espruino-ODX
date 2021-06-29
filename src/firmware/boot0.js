//handle watchdog timer
var wdint = setInterval(E.kickWatchdog, 5000); // 5 secs
E.enableWatchdog(10, false); // 20 secs
E.kickWatchdog();

const STOR = require("Storage");

const pins = {
    KX022_SDA: D3,
    KX022_SLC: D5,
    KX022_EN: D6,

    SI1142_SCL: D9,
    SI1142_SDA: D10,
    SI1142_LED: D18,

    S263_SCL: D15,
    S263_SDA: D16,
    S263_RDY: D17,

    MOTOR: D25,

    CHARG_L: D14,
    CHARG_H: D21,

    BATTERY: D29,

    OLED_PWR: D26,
    OLED_CS: D19,
    OLED_RST: D20,
    OLED_DC: D22,
    OLED_MX25_CLK: D30,
    OLED_MX25_MOSI: D31
};
const vLow = 675;
const vHigh = 843;

const lcd = require("oled");
const iqs = require("iqs263v2.js");

require("Font8x12.js").add(Graphics);

var i2cTouch = new I2C();
i2cTouch.setup({ scl: pins.S263_SCL, sda: pins.S263_SDA });
const touch = iqs({ i2c: i2cTouch, rdyPin: pins.S263_RDY });


var spi = new SPI();
spi.setup({ mosi: pins.OLED_MX25_MOSI, sck: pins.OLED_MX25_CLK });
const lcdDisplay = require("oled")({
    spi: spi,
    csPin: pins.OLED_CS, dcPin: pins.OLED_DC,
    rstPin: pins.OLED_RST, pwrPin: pins.OLED_PWR
});

const hrm = require("Si1142.js");
var hrI2C = new I2C();
hrI2C.setup({ sda: pins.SI1142_SDA, scl: pins.SI1142_SCL });
const pulse = hrm({i2c:hrI2C, LedPin:pins.SI1142_LED});

const tracker = {
    ON_TIME: 10,
    FACEUP: true,
    VIBRATE: true,
    awake: true,
    time_left: 10,
    ticker: undefined,
    buzz: (v) => {
        if (!tracker.VIBRATE) return;
        v = v ? v : 100;
        if (v <= 50) {
            digitalPulse(pins.MOTOR, true, v);
        } else {
            pins.MOTOR.set();
            setTimeout(() => { pins.MOTOR.reset(); }, v);
        }
    },
    isPower: () => { return pins.CHARG_H.read(); }, //or D21???
    setLCDTimeout: (v) => { tracker.ON_TIME = v < 5 ? 5 : v; },
    init: () => {
        var s = STOR.readJSON("settings.json", 1) || { ontime: 10, timezone: 1, faceup: false, vibrate: true };
        tracker.ON_TIME = s.ontime;
        tracker.time_left = s.ontime;
        tracker.FACEUP = s.faceup;
        tracker.VIBRATE = (typeof s.vibrate != 'undefined') ? s.vibrate : true;
        E.setTimeZone(s.timezone);
    },
    sleep: () => {
        tracker.awake = false;
        touch.stop();
        tracker.emit("sleep", true);
        lcdDisplay.flip(); //make sure finished with SPI before stopping it.
        lcdDisplay.displayOff();
    },
    wake: () => { },
    getBattery: () =>{
        let vBat = analogRead(pins.BATTERY)*4096;
        return Math.floor((vBat - vLow) * 100 / (vHigh - vLow));
    },
    setupBLEServices: () => {
        NRF.setServices({
            'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
                'f8b23a4d-89ad-4220-8c9f-d81756009f0e': {
                    description: 'Service 1',
                    writable: true,
                    onWrite: function (evt) {
                        var cmd = evt.data[0];
                        var arg = evt.data[1];
                        executeCommand(cmd, arg);
                    }
                },
                'f8b23a4d-89ad-4220-8c9f-d81756009f0d': {
                    description: 'Service 2',
                    notify: true,
                    readable: true,
                    value: [odx.getPulseData()]
                }
            }
        });
    },
};

function watchBat() {
    pinMode(pin.CHARG_H, "input", false);
    setWatch(() => {
        if (!tracker.awake) tracker.wake();
        tracker.emit("power", pin.CHARG_H.read());
    }, pin.CHARG_H, { edge: "both", repeat: true, debounce: 0 });
}




const onTouch = (event) => {
    //console.log(event);

    if (event == false) return;
    tracker.wake();
    lcdDisplay.clear();
    //console.log(">> ", event.leftFlick);
    if (event.flick == "UP") {
    }
    else if (event.flick == "DOWN") {
    }
    else if (event.tap == "DOWN") {
    }
    else if (event.tap == "UP") {
    }
    else if (event.tap == "MIDDLE") {
    }
    else if (event.tap == "HOME") {
    }
};

function drawSpalsScreen()
{
    lcdDisplay.clear();
    lcdDisplay.setFont8x12();
    lcdDisplay.drawImage(STOR.read("logo.png"),10,30);
    lcdDisplay.drawString("Espruino", 15, 128 / 2);
    lcdDisplay.drawString(process.env.VERSION,20, (128 / 2) + 15);
    lcdDisplay.flip();
}

tracker.init();

drawSpalsScreen();

//var odx = require("odx");
//odx(pulse);
touch.setTouchCallback(onTouch);
touch.setDebugMode(false);
touch.start();

tracker.buzz(100);

NRF.on('disconnect', function(reason) {
    odx.stop();
});
