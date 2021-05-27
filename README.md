# Espruino-ODX
Espruino support for ODX project 

Flashing ODX code from Web IDE.
* Uncheck Espruino Web IDE reset before send. This will prevent Web IDE to reset the tracker when the new code is sent from web ide editor (Right hand side).
* Connect the tracker and execute setInterval(function(){poke32(0x40010600,0x6E524635);},1000) **immediately**. This will ping watchdog to prevent reset.
* Take ID107Streaming.js and paset in WEb IDE editor.
* Send the code to tracker. Using RAM button![image](https://user-images.githubusercontent.com/5621639/119782251-90260400-bee9-11eb-9a9c-a6cb2fcf8ba8.png)
* Execute onInit() on left hand side in web IDE. This will initilize the Si114x sensor and setup the BLE service to communication.
* ![image](https://user-images.githubusercontent.com/5621639/119782449-d67b6300-bee9-11eb-80fd-f60d502fc529.png)
* Execute onInit() again untill the above message.
* Disconnect the Web IDE (and any aother connections like web/html). This will restart BLE to take new services configured and discoverable.
* Open Index.html and click connect.
* Click Start sampling button if no data is showing in chart.
![image](https://user-images.githubusercontent.com/5621639/119782838-44278f00-beea-11eb-8841-ad14c03aa852.png)

