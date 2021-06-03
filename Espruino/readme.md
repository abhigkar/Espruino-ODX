##Use this Espruino firmware 
Use nrfConnect iOs/Android app to upload Espruino firmare.

This Firmware is custom build taking source code from official Espruino repository and rebuilt for SDK11 (which Espruino does not support officially).


**_(WARRINING)_**


Since ID107 HR plus and PlayFit-53 tracker bootloader is on SDK11, we cannot flash Espruino which is compiled for SDK12 (official). If you do so, you may brick your tracker. 

**There are 2 possibilities**

**If your tracker is brand new and running the stock firrmware**
* Open nrfConnnect iOs/Android App
* Search for your tracker and connect
* Search for characteristics '0x0af6' and write 0101
* Device should disconnect and a new device should appear in scan with 'OTAMODE' ('OTA' for PlayFit-53)
* Now connect to OTAMODE ('OTA' for PlayFit-53) device and go to DFU upload
* Select Espruino firmware from this repository and upload
* Afer successful upload now you will have Espruino on your tracker.


**If your tracker is already running Espruino**
* Check the version running
* Connect the tracker with the Espruino Web IDE and type ```process.env.VERSION``` on left hand side.
* _For ID107HR Plus only:_ If the version is below "2v07.9", you may need to flash this firmware as BLE custom services may not work. 


**Reflash/Upgrade Espruino**
To upgrade or reflash Espruino follow below process
* Paste below command in left hand side of WEb IDE
```
E.setFlags({unsafeFlash:1})
var f=require("Flash")
f.erasePage(0x7f000)
E.reboot()
```
* Device will reset and will go to DFU mode
* Open nrfConenct and scan for OTAMODE ('OTA' for PlayFit-53) device
* Now connect to OTAMODE ('OTA' for PlayFit-53) device and go to DFU upload
* Select Espruino firmware from this repository and upload
* Afer successful upload now you will have Espruino on your tracker.

