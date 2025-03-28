document.addEventListener("DOMContentLoaded", function() {
    
  fetch('/SVH/ColorData.csv')
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

function hsvToRgb(h, s, v) {
    s /= 100; 
    v /= 100;
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return { r, g, b };
}

function newQuestion() {
  
    let rootStyles = getComputedStyle(document.documentElement);
  let h = Math.floor(Math.random() * 120) * 3;
  let s = Math.floor(Math.pow(Math.random(), 0.8) * 11) * 10;
  let v = Math.floor(Math.pow(Math.random(), 0.5) * 11) * 10;
  let b = rootStyles.getPropertyValue('--bb-color-mode').trim().toString().padStart(2, '0');
  let hPad = h.toString().padStart(3, '0');
  let sPad = s.toString().padStart(3, '0');
  let vPad = v.toString().padStart(3, '0');

  let rgb = hsvToRgb(h, s, v);

  // Update the <div> element with id "color-block"
  let divBlock = document.getElementById("color-block");
  divBlock.style.backgroundColor = `rgb(${rgb["r"]}, ${rgb["g"]}, ${rgb["b"]})`;

  // Assign custom dataset attributes
  divBlock.dataset.imageName = `#${hPad}${sPad}${vPad}${b}`;
  divBlock.dataset.H = h.toString();
  divBlock.dataset.S = s.toString();
  divBlock.dataset.V = v.toString();
  divBlock.dataset.B = b.toString();
  
  if (window.colorData && window.colorData.length > 0) {
      let closest = getClosestColors(h, s, v, window.colorData);
      closest = closest.slice(0, 6);     // Select the six closest options first
      closest = shuffleArray(closest);     // Then shuffle these six options
      
      while (closest.length < 6) {
          closest.push({ "Color Name": "Unknown", "Hex Code": "#000000", "Serial": "N/A" });
      }
      assignOptions(closest);
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
          Math.pow(1*(v / 100) * (s / 100),0.2) * Math.pow(dH, 2) +
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
      btn.dataset.serial = opt["Serial"].toString();
  });
}

function optionClicked(e) {
  let btn = e.currentTarget;
  let colorName = btn.dataset.colorName;
  let hexCode = btn.dataset.hexCode;
  let serial = btn.dataset.serial;
  
  // Retrieve data from the image element's dataset
  let img = document.getElementById("color-block");
  let imageName = img.dataset.imageName;
  let H = img.dataset.H;
  let S = img.dataset.S;
  let V = img.dataset.V;
  let B = img.dataset.B;
  
  let responseData = {
      imageName: imageName.toString(),
      H: H.toString(),
      S: S.toString(),
      V: V.toString(),
      B: B.toString(),
      colorName: colorName,
      hexCode: hexCode,
      serial: serial.toString(),
      timestamp: new Date().toISOString()
  };
  
  console.log("Saving response:", responseData);
  

  console.log("Saving response:", responseData);

  // Replace with your actual Apps Script web app URL.
  const scriptURL = 'https://script.google.com/macros/s/AKfycby8ahPN-LqfLu3n7e7lFCuQHiS26JZCYCduHGmmtoFMdUWfr-armecfLW7FAz9IOaW-/exec';

  // Send the data via a POST request.
  fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors',    // Use 'no-cors' if you face CORS issues.
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
  })
  .then(response => {
      console.log("Response saved");
      // Optionally, you can parse and use the response if mode is not no-cors.
  })
  .catch(err => {
      console.error("Error saving response:", err);
  });
  
  setTimeout(newQuestion, 100);
}

