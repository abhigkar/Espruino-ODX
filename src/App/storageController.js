var isStorageHasData = false;


function toTimestamp() {


    const time = new Date().toLocaleString('ko-KR', {
        timeZone: 'Europe/Moscow',
        hourCycle: 'h23',
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    console.log(time);

    return time;
}






function addSensorDataToStorage(data, elaspedTime) {
    if (data != undefined) {
        if (localStorage.csv == undefined || localStorage.csv == "") {
            localStorage.csv = ",,,,,\n";
        }
        localStorage.csv += `${toTimestamp()},${elaspedTime},${data[0]},${data[1]},${data[2]},${data[3]}\n`;
        //localStorage.csv += `${new Date().toTimestamp()},${data[0]},${data[1]},${data[2]},${data[3]}\n`;
        isStorageHasData = true;
    }
}

function generateCsvFromStorage() {
    if (isStorageHasData) {
        var alink = document.createElement("a");
        alink.href = URL.createObjectURL(new Blob([localStorage.getItem("csv")], { type: "text/csv" }));;
        alink.download = getFileName();
        isStorageHasData = false;
        alink.click();
        localStorage.csv = "";
        alink.remove();
    }
}

function getFileName() {
    return toTimestamp() + ".csv";
}