
document.addEventListener("DOMContentLoaded", function() {
  
  fetch('./SVH/ColorData.csv')
    .then(response => response.text())
    .then(text => {
      window.colorData = parseCSV(text);
      newQuestion();
    })
    .catch(err => {
      console.error("Error loading CSV data:", err);
      window.colorData = [];
      newQuestion();
    });
  
  
  let optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach(btn => {
    btn.addEventListener("click", optionClicked);
  });
});
  
function parseCSV(text) {
  let lines = text.trim().split("\n");
  let headers = lines[0].split(",");
  let data = [];
  for (let i = 1; i < lines.length; i++) {
    let row = lines[i].split(",");
    let obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index].trim();
    });
    
    obj["R"] = parseFloat(obj["R"]);
    obj["G"] = parseFloat(obj["G"]);
    obj["B"] = parseFloat(obj["B"]);
    obj["H"] = parseFloat(obj["H"]);
    obj["S"] = parseFloat(obj["S"]);
    obj["V"] = parseFloat(obj["V"]);
    data.push(obj);
  }
  return data;
}

function newQuestion() {
  
  let h = Math.floor(Math.random() * 120) * 3;   
  let s = Math.floor(Math.pow(Math.random(),0.7) * 11) * 10;    
  let v = Math.floor(Math.pow(Math.random(),0.4) * 11) * 10;    
  let b = Math.random() < 0.5 ? "00" : "99";      
  
  
  let hPad = h.toString().padStart(3, '0');
  let sPad = s.toString().padStart(3, '0');
  let vPad = v.toString().padStart(3, '0');
  
  let filename = `${hPad}${sPad}${vPad}${b}.png`;
  let path = `SVH/${b}/${sPad}/${vPad}/${filename}`;
  
  // Update the image element
  let img = document.getElementById("color-block");
  img.src = path;
  img.alt = filename.replace(".png", "");
  
  
  if (window.colorData && window.colorData.length > 0) {
    let closest = getClosestColors(h, s, v, window.colorData);
    
    closest = shuffleArray(closest);
    
    while (closest.length < 6) {
      closest.push({ "Color Name": "Unknown", "Hex Code": "#000000", "Serial": "N/A" });
    }
    assignOptions(closest.slice(0, 6));
  } else {
    let defaultOptions = [
      { "Color Name": "White", "Hex Code": "#ffffff", "Serial": "1" },
      { "Color Name": "Still White", "Hex Code": "#ffffff", "Serial": "1" },
      { "Color Name": "White again!!", "Hex Code": "#ffffff", "Serial": "1" },
      { "Color Name": "White", "Hex Code": "#ffffff", "Serial": "1" },
      { "Color Name": "White", "Hex Code": "#ffffff", "Serial": "1" },
      { "Color Name": "White", "Hex Code": "#ffffff", "Serial": "1" }
    ];
    assignOptions(defaultOptions);
  }
}

function getClosestColors(h, s, v, colors) {
  
  let results = colors.map(color => {
    let h0 = color["H"];
    let s0 = color["S"];
    let v0 = color["V"]; 

    let dH = Math.abs(h - h0);
    dH = Math.min(dH, 360 - dH);

    // Linear differences:
    let dS = Math.abs(s - s0);
    let dV = Math.abs(v - v0);
    
    let distance = Math.sqrt(
      Math.pow(7*(v / 100) * (s / 100),0.2) * Math.pow(dH, 2) +
      3 * (v / 100) * Math.pow(dS, 2) +
      5 * Math.pow(dV, 2) +
      h0 * (1 - Math.pow(s / 100, 2)) * (1 - Math.pow(v / 100, 2))
    );
    
    return Object.assign({}, color, { distance: distance });
  });
  results.sort((a, b) => a.distance - b.distance);
  return results;
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function assignOptions(options) {
  let buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn, index) => {
    let opt = options[index];
    // Convert color name to Title Case
    let colorName = opt["Color Name"].split(" ").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
    btn.textContent = colorName;
    btn.dataset.colorName = colorName;
    btn.dataset.hexCode = opt["Hex Code"];
    btn.dataset.serial = opt["Serial"];
  });
}

function optionClicked(e) {
  let btn = e.currentTarget;
  let colorName = btn.dataset.colorName;
  let hexCode = btn.dataset.hexCode;
  let serial = btn.dataset.serial;
  let imageName = document.getElementById("color-block").alt + ".png";
  
  let responseData = {
    imageName: imageName,
    colorName: colorName,
    hexCode: hexCode,
    serial: serial,
    timestamp: new Date().toISOString()
  };
  
  console.log("Saving response:", responseData);
  setTimeout(newQuestion, 100);
}
