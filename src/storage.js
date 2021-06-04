var isStorageHasData = false;


Date.prototype.toTimestamp = function () {
    let d = new Date();
    return `${d.getDate()}${d.getMonth()}${d.getFullYear()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}${d.getMilliseconds()}`;
}

function addSensorDataToStorage(data) {
    if (data != undefined) {
        if (localStorage.csv == undefined || localStorage.csv == "") {
            localStorage.csv = ",,,,,,\n";
        }
        localStorage.csv += `${new Date().toTimestamp()},${data[0]},${data[1]},${data[2]},${data[3]},${data[4]}\n`;
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
    return new Date().toTimestamp() + ".csv";
}