// When the DOM is ready, load CSV data and attach event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Fetch and parse the CSV file containing color data
    fetch('SVH/ColorData.csv')
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
    
    // Attach click events to option buttons
    let optionButtons = document.querySelectorAll(".option-btn");
    optionButtons.forEach(btn => {
      btn.addEventListener("click", optionClicked);
    });
  });
  
  /**
   * Parses CSV text into an array of objects.
   * Expected header: Color Name,Hex Code,Serial,Name Code,R,G,B,H,S,V
   */
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
      // Convert numeric fields as needed
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
  
  /**
   * Generates a new question:
   * - Randomly selects HSV and background code (B)
   * - Constructs the image filename and updates the image element
   * - Determines closest color options from CSV data and shuffles them
   */
  function newQuestion() {
    // Generate random values:
    let h = Math.floor(Math.random() * 120) * 3;   // H: 0,3,6,...,357
    let s = Math.floor(Math.random() * 11) * 10;     // S: 0,10,...,100
    let v = Math.floor(Math.random() * 11) * 10;     // V: 0,10,...,100
    let b = Math.random() < 0.5 ? "00" : "99";       // Background: "00" or "99"
    
    // Pad the values to three digits (for H, S, V)
    let hPad = h.toString().padStart(3, '0');
    let sPad = s.toString().padStart(3, '0');
    let vPad = v.toString().padStart(3, '0');
    
    // Construct the filename and the path:
    // Path format: SVH/BB/SSS/VVV/HHHSSSVVVBB.png
    let filename = `${hPad}${sPad}${vPad}${b}.png`;
    let path = `SVH/${b}/${sPad}/${vPad}/${filename}`;
    
    // Update the image element
    let img = document.getElementById("color-block");
    img.src = path;
    img.alt = filename.replace(".png", "");
    
    // If CSV data is available, determine closest color options
    if (window.colorData && window.colorData.length > 0) {
      let closest = getClosestColors(h, s, v, window.colorData);
      // Shuffle options to randomize their order
      closest = shuffleArray(closest);
      // Ensure we have exactly six options (pad with default if needed)
      while (closest.length < 6) {
        closest.push({ "Color Name": "Unknown", "Hex Code": "#000000", "Serial": "N/A" });
      }
      assignOptions(closest.slice(0, 6));
    } else {
      // Fallback default options (all white)
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
  
  /**
   * Calculates the closest colors from the CSV data based on HSV distance.
   * Uses a weighted Euclidean distance where:
   *   dH = min(|h1 - h2|, 360 - |h1 - h2|)
   *   dS = s1 - s2, dV = v1 - v2
   *   distance = sqrt(8*(dH)^2 + 4*(dS)^2 + 5*(dV)^2)
   */
  function getClosestColors(h, s, v, colors) {
    let results = colors.map(color => {
      let dH = Math.abs(h - color["H"]);
      dH = Math.min(dH, 360 - dH);
      let dS = s - color["S"];
      let dV = v - color["V"];
      let distance = Math.sqrt(8 * dH * dH + 4 * dS * dS + 5 * dV * dV);
      return Object.assign({}, color, { distance: distance });
    });
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
  
  /**
   * Shuffles an array in place using the Fisher-Yates algorithm.
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Assigns options (color names) to the buttons.
   * The color name is converted to Title Case.
   * Custom data attributes are added to each button.
   */
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
  
  /**
   * Handler for when an option button is clicked.
   * It gathers the current image name and the option data,
   * logs the response data (or sends it to your backend),
   * and then refreshes the question.
   */
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
    // TODO: Send responseData to your backend (e.g., Google Sheets or GitHub)
    
    // Refresh the question after a short delay
    setTimeout(newQuestion, 100);
  }
  