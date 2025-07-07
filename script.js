/*
#################################
###      state and init       ###
################################
*/

let appState;

const charState = Object.freeze({
  NORMAL: "normal",
  CURRENT: "current",
  CORRECT: "correct",
  INCORRECT: "incorrect"
});


function newState(userPositionVal, maxLineSizeVal, numberOfLineShownVal, charsVal, wordsVal){
    return {
            userPosition: userPositionVal,
            maxLineSize:  maxLineSizeVal,
            numberOfLineShown: numberOfLineShownVal,
            chars : charsVal,
            words: wordsVal
    };
}

function initializeAppState(){
    //setup initial values 
    return newState(0, 0, 10, [])
}

async function init(){
    appState = initializeAppState();
    //fetch api for words
    const words  = await fetchWords();
    //process chars 
    const chars = processWords(words);
    //compute maxLineSize
    const maxLineSize = getMaxLineSize();
    appState = newState(appState.userPosition, maxLineSize, appState.numberOfLineShown, chars, words);
}

/*
#################################
###      word fetching        ###
################################
*/

async function fetchWords(){
    try {
        const response = await fetch("https://random-word-api.herokuapp.com/word?number=1000");
        const data = await response.json();
        return data;
    } catch (error){
        showError("could not load words");
    }
}

function processWords(words){
    let chars = []
    for (let word of words){
        for (let charVal of word){
            chars.push({char : charVal, state: charState.NORMAL});
        }
        chars.push({char: " ", state: charState.NORMAL});
    }
    return chars;
}

// Calculate how many span elements can fit on one line
function getMaxLineSize() {
    const textZone = document.querySelector("#text");

    const tempSpan = createSpanChar({char:"W", state: charState.NORMAL});
    tempSpan.style.visibility = "hidden";
    textZone.appendChild(tempSpan);
    
    const textZoneStyle = window.getComputedStyle(textZone);
    const spanStyle = window.getComputedStyle(tempSpan);
    
    const containerWidth = textZone.clientWidth - 
        parseFloat(textZoneStyle.paddingLeft) - 
        parseFloat(textZoneStyle.paddingRight);
    
    const spanWidth = tempSpan.offsetWidth;
    
    const gap = parseFloat(textZoneStyle.gap) || 0;

    textZone.removeChild(tempSpan);
    const spansPerLine = Math.floor((containerWidth + gap) / (spanWidth + gap));

    return Math.max(1, spansPerLine); // Ensure at least 1 span per line
}

/*
#################################
###       displaying          ###
################################
*/

function displayState(){
    clearTexteZone();
    const divTexte = document.querySelector("#text");
    startingChar = Math.floor(appState.userPosition / appState.maxLineSize) * appState.maxLineSize;
    endingChar =  appState.maxLineSize * appState.numberOfLineShown;

    for (let i = startingChar; i < endingChar; i++){
        let curr_char = appState.chars[i];
        const span = createSpanChar(curr_char);
        divTexte.appendChild(span);
    }
}

function clearTexteZone(){
    const divTexte = document.querySelector("#text");
    while (divTexte.hasChildNodes()){
        divTexte.removeChild(divTexte.firstChild);
    }
}

function createSpanChar(curr_char){
    const span = document.createElement("span");
    span.innerText = curr_char.char;
    span.classList.add("active-char")
    switch(curr_char.state){
        case charState.CORRECT:
            span.classList.add("correct");
            break;
        case charState.INCORRECT:
            span.classList.add("incorrect");
            break;
        case charState.CURRENT:
            span.classList.add("current");
            break;
        case charState.NORMAL:
            span.classList.add("active-char")
            break;
    }
    return span;

}
init().then(() =>
{
    displayState();

})


/*
#################################
###      event handling       ###
################################
*/
document.addEventListener('keydown', e => {
    if (e.key === "Backspace") {
        if (appState.user_position<=0) return;
        let currentPosition = appState.userPosition;
        let newPosition = currentPosition-1;
        let newChars = appState.chars
        newChars[currentPosition].state = charState.NORMAL;
        newChars[newPosition].state = charState.CURRENT;
        appState = newState(newPosition, appState.maxLineSize, appState.numberOfLineShown, newChars, appState.words);

    }else{
        if (appState.user_position >= appState.chars.length) return;
        if (e.key.length !== 1) return;
        let currentPosition = appState.userPosition;
        let newPosition = currentPosition+1;
        let newChars = appState.chars
        newChars[currentPosition].state =  e.key === newChars[currentPosition].char ? charState.CORRECT : charState.INCORRECT;
        newChars[newPosition].state = charState.CURRENT;
        appState = newState(newPosition, appState.maxLineSize, appState.numberOfLineShown, newChars, appState.words);

    }
    displayState();
    return;    
});

document.addEventListener('resize', e => {
    
});


window.addEventListener('resize', function() {
    // Code to run when the window is resized
    // For your app: recalculate maxLineSize and rerender!
    appState = newState(appState.userPosition, getMaxLineSize(), appState.numberOfLineShown, appState.chars, appState.words)
    displayState();
});