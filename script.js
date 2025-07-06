let appState = {
  elements: [],
  user_position: 0,
  max_line_size: 0,
  window_size : 3
};

// Calculate how many span elements can fit on one line
function calculateSpansPerLine() {
    const textZone = document.querySelector("#text");
    
    const tempSpan = createCharSpan("W");
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

// Create a span for a letter/character
function createCharSpan(character) {
    const a = document.createElement("span");
    a.textContent = character;
    a.classList.add("active-char");
    return a;
}
 
function createDivLine(){
    let line = document.createElement("div");
    line.classList.add("line");
    return line;
}
// remove every line in the text div 
function clearLines() {
    const textZone = document.querySelector("#text");
    while (textZone.firstChild) {
        textZone.removeChild(textZone.firstChild);
    }
}

//create element list 
function createElementList(word_list) {
    let elements = [];
    for (const word of word_list) {
        for (const char of word) {
            let letter = createCharSpan(char);
            elements.push(letter);
        }
    let space = createCharSpan(" ");
    elements.push(space);
    }

    return elements;
}


function arrangeLinesOfElements(elements){
    let lines = [];
    index = 0;
    let curr_line =[]
    while (index  < elements.length){
        if (index % appState.max_line_size == 0 && index != 0){
            lines.push(curr_line);
            curr_line = [];
        }
        curr_line.push(elements[index]);
        index++;
    }
    if (curr_line.length != 0) lines.push(curr_line);

    return lines;
}

function createDivOfElements(lines){
    let lines_element = []
    let line_element = createDivLine()
    for (let line of lines){
        for(let element of line){
            line_element.appendChild(element);
        }
        lines_element.push(line_element);
        line_element = createDivLine();
    }
    return lines_element;
}

function displayLines(line_divs){
    const textZone = document.querySelector("#text")
    clearLines();
    for (let i = 0; i < appState.window_size && i < line_divs.length; i++){
        textZone.appendChild(line_divs[i]);
    }
    if(appState.elements.length > 0) {
    appState.elements[0].classList.add("current")
    }
}


function get_word_list(){
    fetch('https://random-word-api.herokuapp.com/word?number=1000')
    .then(response => response.json()) 
    .then(data => {
        appState.max_line_size = calculateSpansPerLine()
        appState.elements = createElementList(data);
        element_lines= arrangeLinesOfElements(appState.elements);
        divs = createDivOfElements(element_lines);
        displayLines(divs, appState.window_size);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

get_word_list();




document.addEventListener('keydown', e => {
    if (e.key === "Backspace") {
        if (appState.user_position <=0 ) return;

        let curr_element = appState.elements[appState.user_position];
        curr_element.classList.remove("current");
        appState.user_position--;
        let new_element = appState.elements[appState.user_position]
        new_element.classList.remove("correct");
        new_element.classList.remove("incorrect");
        appState.elements[appState.user_position].classList.add("current");
        return;
    }
    if (appState.user_position >= appState.elements.length) return;
    if (e.key.length !== 1) return;
    let curr_element =appState.elements[appState.user_position];
    let isCorrect = e.key === curr_element.textContent;
    curr_element.classList.toggle("correct", isCorrect);
    curr_element.classList.toggle("incorrect", !isCorrect);

    curr_element.classList.remove("current");
    appState.user_position++;

    if ((appState.user_position-1) %  appState.max_line_size == 0 && (appState.user_position-1) != 0){
        console.log("tahsah")
        let textZone = document.querySelector("#text");
        textZone.removeChild(textZone.firstChild);
        let new_index = appState.window_size + Math.floor(appState.user_position / appState.max_line_size) -1;
        if (new_index < divs.length) textZone.appendChild(divs[new_index]);
    }

    if (appState.user_position < appState.elements.length) {
        appState.elements[appState.user_position].classList.add("current");
    }
});

