// Signature hitbox: hover/focus opens nav panel. Fixed incorrect classList usage

let hoverTimer;

document.addEventListener("DOMContentLoaded", function () {
    const hitbox = document.getElementById('signature-box');
    const savedTheme = localStorage.getItem("theme");

    hitbox.addEventListener('pointerenter', () => {
        hoverTimer = setTimeout(() => { hitbox.focus();  }, 200);
    });

    hitbox.addEventListener('pointerleave', () => {
        clearTimeout(hoverTimer); hitbox.blur();
    });

    hitbox.addEventListener('focus', () => openNavPanel());
    hitbox.addEventListener('blur', () => closeNavPanel());

    if (!savedTheme) {  localStorage.setItem("theme", "auto");  savedTheme = "auto";  }

    if      (savedTheme === "dark" ) setDarkTheme() ;
    else if (savedTheme === "light") setLightTheme();
                        else        setAutoTheme();

    themeToggleEventMaker();

    shiftCommand("initialise");

    document.getElementById("neverEastToggle").addEventListener("click", () => shiftCommand("neverEast"));
    document.getElementById("neverWestToggle").addEventListener("click", () => shiftCommand("neverWest"));

});

// __________________________________________________________________________________________________________________
// ============================================== Theme Toggle Functions ==============================================
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function themeToggleEventMaker(){
  themeToggleBtn.addEventListener("click", function () {
        themeIcon.classList.add("rotate");
        // document.getElementById("signature-box").blur();
        setTimeout(() => {
            let currentTheme = localStorage.getItem("theme") || "auto";

            if (currentTheme === "light") {
                themeIcon.innerText = "dark_mode";
                localStorage.setItem("theme", "dark"); 
                setDarkTheme();
            }
            else if (currentTheme === "dark") {
                localStorage.setItem("theme", "auto");
                setAutoTheme(); }
            else {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', updateAutoTheme);
                themeIcon.innerText = "light_mode";
                localStorage.setItem("theme", "light");
                setLightTheme(); 
            }

            setTimeout(() => {
                themeIcon.classList.remove("rotate");
            }, 700);

        }, 300);
    });
}


function setLightTheme(){

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-background').trim();

    document.documentElement.setAttribute("data-bs-theme", "light");

    metaThemeColor.setAttribute("content", black);
}

function setDarkTheme(){
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-background').trim();

    document.documentElement.setAttribute("data-bs-theme", "dark");

    metaThemeColor.setAttribute("content", black);         
}

function setAutoTheme() {
    updateAutoTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateAutoTheme);
}

function updateAutoTheme() {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
     if (systemDark) {themeIcon.innerText = "brightness_4"; }
      else {themeIcon.innerText = "brightness_5"; }
    applyTheme(systemDark ? "dark" : "light");
}

function applyTheme(theme) {
    themeIcon.style.opacity = "0";
    themeIcon.style.transform = "rotate(180deg) scale(0.8)";

    setTimeout(() => {
        themeIcon.style.opacity = "1";
        themeIcon.style.transform = "rotate(0) scale(1)";
    }, 200);

    if (theme === "dark") setDarkTheme();
    else setLightTheme();
}


// ___________________________________________________________________________________________________________________
// ============================================== Command Box Functions ==============================================

let showTimeouts = [];
let hideTimeouts = [];

let itemTime = 50;
let panelTime = 100;

function clearAllTimeouts(arr) {
  arr.forEach(clearTimeout);
  arr.length = 0;
}

let commandBox = document.getElementById('commandBox');
let commandPanels = document.querySelectorAll('.commandPanel');

// --------------- Open Nav Panel ---------------

function openNavPanel() {
  clearAllTimeouts(hideTimeouts);

  commandBox.classList.remove('hide');
  commandBox.classList.add('show');

  clearAllTimeouts(showTimeouts);

  commandPanels.forEach((commandPanel, i) => {
    const tPanel = setTimeout(() => {
      commandPanel.classList.remove('contract');
      commandPanel.classList.remove('hide');
      commandPanel.classList.add('show');

      const panelItems = commandPanel.querySelectorAll('.panel-item');
      panelItems.forEach((panelItem, j) => {
        const tItem = setTimeout(() => {
          panelItem.classList.remove('hide');
          panelItem.classList.add('show');
        }, j * itemTime + 5);
        showTimeouts.push(tItem);
      });
    }, i * panelTime);
    showTimeouts.push(tPanel);
  });
}

function closeNavPanel() {
  clearAllTimeouts(showTimeouts);
  commandBox.classList.remove('show');
  clearAllTimeouts(hideTimeouts);

  const panels = [...commandPanels].reverse();
  panels.forEach((commandPanel, i) => {
    
    const tPanel = setTimeout(() => {
      const panelItems = [...commandPanel.querySelectorAll('.panel-item')].reverse();
      commandPanel.classList.remove('show');
      commandPanel.classList.add('contract');
      panelItems.forEach((panelItem, j) => {
        const tItem = setTimeout(() => {
          panelItem.classList.remove('show');
          panelItem.classList.add('hide');
        }, j * itemTime);
        hideTimeouts.push(tItem);
      });

      const tHidePanel = setTimeout(() => {
        commandPanel.classList.add('hide');
      }, panelItems.length * itemTime);
      hideTimeouts.push(tHidePanel);
      
      if (i === panels.length - 1) {
        const tHideBox = setTimeout(() => {
          commandBox.classList.add('hide');
          document.getElementById("signature-box").blur();
        }, panelItems.length * itemTime + panelTime);
        hideTimeouts.push(tHideBox);
      }
    }, i * panelTime);
    hideTimeouts.push(tPanel);
  });
}


// __________________________________________________________________________________________________________________
// ============================================== Nav Position Toggles ==============================================

const shiftTime = 1200; // in ms
const sig = document.getElementById("signature-box");
const neverEast = document.getElementById("neverEast");
const neverWest = document.getElementById("neverWest");

// Map current position to arrow directions
const arrowMap = {
  'top-left':    { east: "south", west: "east" },
  'top-right':   { east: "west",  west: "south" },
  'bottom-left': { east: "north", west: "east" },
  'bottom-right':{ east: "west",  west: "north" }
};

// Transition definitions
const transitions = {
  "TL->TR": { axis: "horz", remove: "left", addAnim: "left2right", addFinal: "right", navHorz: "right" },
  "TR->TL": { axis: "horz", remove: "right", addAnim: "right2left", addFinal: "left", navHorz: "left" },
  "TL->BL": { axis: "vert", remove: "top", addAnim: "top2bottom", addFinal: "bottom", navVert: "bottom" },
  "TR->BR": { axis: "vert", remove: "top", addAnim: "top2bottom", addFinal: "bottom", navVert: "bottom" },
  "BR->BL": { axis: "horz", remove: "right", addAnim: "right2left", addFinal: "left", navHorz: "left" },
  "BL->BR": { axis: "horz", remove: "left", addAnim: "left2right", addFinal: "right", navHorz: "right" },
  "BL->TL": { axis: "vert", remove: "bottom", addAnim: "bottom2top", addFinal: "top", navVert: "top" },
  "BR->TR": { axis: "vert", remove: "bottom", addAnim: "bottom2top", addFinal: "top", navVert: "top" },
};

function arrowsUpdate(vert, horz) {
  const key = `${vert}-${horz}`;
  spacer = document.querySelector(".top-spacer");
  if (spacer){
      if (vert == "bottom"){spacer.classList.add("contract");}
      else {spacer.classList.remove("contract");}
  }


  const arrows = arrowMap[key];
  if (arrows) {
    neverEast.innerText = arrows.east;
    neverWest.innerText = arrows.west;
    console.log(key);
  }
}

function shiftSignature(transitionKey) {
  const t = transitions[transitionKey];
  if (!t) return;
  
  sig.classList.remove(t.remove);
  sig.classList.add(t.addAnim);

  setTimeout(() => {
    sig.classList.remove(t.addAnim);
    sig.classList.add(t.addFinal);
  }, shiftTime);

  if (t.navVert) localStorage.setItem("navVert", t.navVert);
  if (t.navHorz) localStorage.setItem("navHorz", t.navHorz);
  
  arrowsUpdate(localStorage.getItem("navVert"), localStorage.getItem("navHorz"));
}

function shiftCommand(button) {
  const nowVert = localStorage.getItem("navVert");
  const nowHorz = localStorage.getItem("navHorz");

  if (button === "initialise") {
      if (!nowVert || !(nowVert == "top"  || nowVert == "bottom" )){ localStorage.setItem("navVert", "top") ; nowVert = "top" ; }
      if (!nowHorz || !(nowHorz == "left"  || nowHorz == "right" )){ localStorage.setItem("navHorz", "left"); nowHorz = "left";  }
    sig.classList.add(nowVert, nowHorz);
    arrowsUpdate(nowVert, nowHorz);
    return;
  }

  closeNavPanel();

  setTimeout(() => {
    const keyBase = `${nowVert[0].toUpperCase()}${nowHorz[0].toUpperCase()}`;
    if (button === "neverEast") {
      const nextMap = { TL: "BL", TR: "TL", BR: "BL", BL: "TL" };
      shiftSignature(`${keyBase}->${nextMap[keyBase]}`);
    } else if (button === "neverWest") {
      const nextMap = { TL: "TR", TR: "BR", BR: "TR", BL: "BR" };
      shiftSignature(`${keyBase}->${nextMap[keyBase]}`);
    }
  }, 1000);
}

// const shiftTime = 1200 ; // in ms
// const neverEast = document.getElementById("neverEast");
// const neverWest = document.getElementById("neverWest");

// function shiftCommand(button) {
//   const nowVert = localStorage.getItem("navVert");
//   const nowHorz = localStorage.getItem("navHorz");

//   if (button == "initilise"){
//     if (!nowVert || !(nowVert == "top"  || nowVert == "bottom" )){ localStorage.setItem("navVert", "top") ; nowVert = "top" ; }

//     if (!nowHorz || !(nowHorz == "left"  || nowHorz == "right" )){ localStorage.setItem("navHorz", "left"); nowHorz = "left";  }

//     document.getElementById("signature-box").classList.add(nowVert, nowHorz);

//             if (nowVert == 'top' && nowHorz == "left") { arrowsTL(); }
//     else if (nowVert == 'top' && nowHorz == "right") { arrowsTR(); }
//     else if (nowVert == 'bottom' && nowHorz == "right") { arrowsBR(); }
//     else if (nowVert == 'bottom' && nowHorz == "left") { arrowsBL(); }

//     return;
//   }

//   closeNavPanel();

//   setTimeout(() => {
//       if (button == "neverEast") {
//          if (nowVert == 'top' && nowHorz == "left") { shiftTL2BL(); }
//     else if (nowVert == 'top' && nowHorz == "right") { shiftTR2TL(); }
//     else if (nowVert == 'bottom' && nowHorz == "right") { shiftBR2BL(); }
//     else if (nowVert == 'bottom' && nowHorz == "left") { shiftBL2TL(); }
//   } 
//   else if (button == "neverWest") {
//          if (nowVert == 'top' && nowHorz == "left") { shiftTL2TR(); }
//     else if (nowVert == 'top' && nowHorz == "right") { shiftTR2BR(); }
//     else if (nowVert == 'bottom' && nowHorz == "right") { shiftBR2TR(); }
//     else if (nowVert == 'bottom' && nowHorz == "left") { shiftBL2BR(); }
//   }
//   } ,1000)


// }

// function arrowsTL(){   neverEast.innerText = "south"; neverWest.innerText = "east" ; console.log("top left")}
// function arrowsTR(){   neverEast.innerText = "west" ; neverWest.innerText = "south"; console.log("top right") }
// function arrowsBL(){   neverEast.innerText = "north"; neverWest.innerText = "east" ; console.log("bottom left")}
// function arrowsBR(){   neverEast.innerText = "west" ; neverWest.innerText = "north"; console.log("bottom right")}

// function shiftTL2TR() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('left');
//     sig.classList.add('left2right');
//     setTimeout(() => {
//         sig.classList.remove('left2right');
//         sig.classList.add('right');
//     }, shiftTime);
//     localStorage.setItem("navHorz", "right")
//     arrowsTR() ;
// }

// function shiftTL2BL() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('top');
//     sig.classList.add('top2bottom');
//     setTimeout(() => {
//         sig.classList.remove('top2bottom');
//         sig.classList.add('bottom');
//     }, shiftTime);
//     localStorage.setItem("navVert", "bottom");
//     arrowsBL();
// }

// function shiftTR2BR() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('top');
//     sig.classList.add('top2bottom');
//     setTimeout(() => {
//         sig.classList.remove('top2bottom');
//         sig.classList.add('bottom');
//     }, shiftTime);
//     localStorage.setItem("navVert", "bottom");
//     arrowsBR();
// }

// function shiftTR2TL() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('right');
//     sig.classList.add('right2left');
//     setTimeout(() => {
//         sig.classList.remove('right2left');
//         sig.classList.add('left');
//     }, shiftTime);
//     localStorage.setItem("navHorz", "left")
//     arrowsTL();
// }

// function shiftBR2BL() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('right');
//     sig.classList.add('right2left');
//     setTimeout(() => {
//         sig.classList.remove('right2left');
//         sig.classList.add('left');
//     }, shiftTime);
//     localStorage.setItem("navHorz", "left");
//      arrowsBL() ;
// }

// function shiftBR2TR() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('bottom');
//     sig.classList.add('bottom2top');
//     setTimeout(() => {
//         sig.classList.remove('bottom2top');
//         sig.classList.add('top');
//     }, shiftTime);
//     localStorage.setItem("navVert", "top");
//      arrowsTR();
// }

// function shiftBL2TL() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('bottom');
//     sig.classList.add('bottom2top');
//     setTimeout(() => {
//         sig.classList.remove('bottom2top');
//         sig.classList.add('top');
//     }, shiftTime);
//     localStorage.setItem("navVert", "top");
//      arrowsTL();
// }

// function shiftBL2BR() {
//     const sig = document.getElementById("signature-box");
//     sig.classList.remove('left');
//     sig.classList.add('left2right');
//     setTimeout(() => {
//         sig.classList.remove('left2right');
//         sig.classList.add('right');
//     }, shiftTime);
//     localStorage.setItem("navHorz", "right");
//     arrowsBR();
// }