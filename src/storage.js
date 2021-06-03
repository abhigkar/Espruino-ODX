var isStorageHasData = false;

function addSensorDataToStorage(data){
    if(data != undefined){
	    console.log(`,${data[0]},${data[1]},${data[2]},${data[3]},${data[4]}\n`);
        localStorage.csv += `,${data[0]},${data[1]},${data[2]},${data[3]},${data[4]}\n`;
        isStorageHasData = true;
    }
}

function generateCsvFromStorage(){
    if(isStorageHasData){
        var alink = document.createElement("a");
        //alink.style.display = 'block';
        alink.href=URL.createObjectURL(new Blob([localStorage.getItem("csv")],{type:"text/csv"}));;
        alink.download = getFileName();
        isStorageHasData = false;
        alink.click();
        localStorage.csv="";
        alink.remove();
    }
}

function getFileName(){
    let d = new Date();
    return `${d.getDate()}${d.getMonth()}${d.getFullYear()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}.csv`;
}