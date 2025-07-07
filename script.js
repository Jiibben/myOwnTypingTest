/*
#################################
###      state and init       ###
################################
*/
let timerInterval = null;

let appState;

const charState = Object.freeze({
  NORMAL: "normal",
  CURRENT: "current",
  CORRECT: "correct",
  INCORRECT: "incorrect"
});

const playerState = Object.freeze({
  READY: "ready",
  PLAYING: "playing",
  END: "end"
});


function newState(userPositionVal, maxLineSizeVal, numberOfLineShownVal, charsVal, wordsVal, playerStateVal, timerVal){
    return {
            userPosition: userPositionVal,
            maxLineSize:  maxLineSizeVal,
            numberOfLineShown: numberOfLineShownVal,
            chars : charsVal,
            words: wordsVal,
            playerState : playerStateVal,
            timer: timerVal
    };
}

function initializeAppState(){
    //setup initial values 
    return newState(0, 0, 10, [], playerState.READY, 60);
}


async function init(){
    displayTextZone();
    appState = initializeAppState();
    //fetch api for words
    const words  = await fetchWords();
    //process chars 
    const chars = processWords(words);
    //compute maxLineSize
    appState = newState(appState.userPosition, getMaxLineSize(), appState.numberOfLineShown, chars, appState.playerState, appState.timer);
}

let isLoading = false;

async function start() {
    if (isLoading) return;
    isLoading = true;
    await init();
    appState = newState(appState.userPosition, appState.maxLineSize, appState.numberOfLineShown, appState.chars, appState.words, playerState.PLAYING, appState.timer);
    displayState();
    startTimer();
    isLoading = false;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    document.getElementById('timer').innerText = appState.timer + "s";

}

function startTimer() {
    stopTimer();
    appState.timer = 60;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        appState.timer--;
        updateTimerDisplay()
        if (appState.timer <= 0) {
            stopTimer();             
            appState.playerState = playerState.END; 
            clearTexteZone(); 
            displayScore();
            stopTimer();             

        }   
    }, 1000);
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
    for (let i = startingChar; i < startingChar+ endingChar; i++){
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

function clearGameZone(){
    const game = document.querySelector("#game")
    while (game.hasChildNodes()){
        console.log(game.firstChild.id);
        game.removeChild(game.firstChild);
    }
}
function displayTextZone(){
    clearGameZone();
    const textZone = document.createElement("div");
    textZone.id = "text";
    
    game.appendChild(textZone);
}

function displayScore(){
    clearTexteZone();
    clearGameZone();
    let data = calculateWpmAndErrors();
    let wpm = (data.correct/5);
    showScoreCard(wpm);
}
function showScoreCard(wpm) {
    // Create card div
    const card = document.createElement('div');
    card.id = 'score-card';
    card.className = 'score-card';

    // Set inner HTML (copy from the HTML I gave earlier)
    card.innerHTML = `
        <div class="score-title">Test Complete!</div>
        <div class="score-wpm">
            <span class="score-label">WPM</span>
            <span class="score-value" id="score-wpm">${wpm}</span>
        </div>
        <div class="score-footer">
            <button id="play-again" type="button">Play Again</button>
        </div>
    `;
    document.querySelector("#game").appendChild(card);

    document.querySelector("#play-again").addEventListener("click", (e) => {
       clearGameZone();
    })
}
/*
#################################
###      event handling       ###
################################
*/
document.addEventListener('keydown', e => {
    if (appState == undefined || appState.playerState != playerState.PLAYING) return;
    if (e.key === "Backspace") {
        if (appState.user_position<=0) return;
        let currentPosition = appState.userPosition;
        let newPosition = currentPosition-1;
        let newChars = appState.chars
        newChars[currentPosition].state = charState.NORMAL;
        newChars[newPosition].state = charState.CURRENT;
        appState = newState(newPosition, appState.maxLineSize, appState.numberOfLineShown, newChars, appState.words, appState.playerState, appState.timer);

    }else{
        if (appState.user_position >= appState.chars.length) return;
        if (e.key.length !== 1) return;
        let currentPosition = appState.userPosition;
        let newPosition = currentPosition+1;
        let newChars = appState.chars
        newChars[currentPosition].state =  e.key === newChars[currentPosition].char ? charState.CORRECT : charState.INCORRECT;
        newChars[newPosition].state = charState.CURRENT;
        appState = newState(newPosition, appState.maxLineSize, appState.numberOfLineShown, newChars, appState.words, appState.playerState, appState.timer);

    }
    displayState();
    return;    
});


window.addEventListener('resize', function() {
    if (appState.playerState != playerState.PLAYING) return;
    appState = newState(appState.userPosition, getMaxLineSize(), appState.numberOfLineShown, appState.chars, appState.words, appState.playerState, appState.timer)
    displayState();
});


document.querySelector("#start").addEventListener("click",(e) => {
    if (appState === undefined || (appState.playerState === playerState.READY || appState.playerState === playerState.END)){
    start();
    e.target.blur();}
});


document.querySelector("#restart").addEventListener("click", (e) =>{
    start();
    e.target.blur();

});


/*
#################################
###      result processing    ###
################################
*/

function calculateWpmAndErrors(){
    const chars = appState.chars;
    let correctCount = 0
    let incorrectCount = 0
    for (let i = 0; chars[i].state != charState.CURRENT; i++){
        if (chars[i].state === charState.CORRECT) correctCount++;
        if (chars[i].state === charState.INCORRECT) incorrectCount++;

    }

    return {correct : correctCount, incorrect : incorrectCount, total : incorrectCount + correctCount};
}


