let keywords = [];

/* Handle keyword input */

function handleKeyword(event) {

let input = document.getElementById("keywordInput");
let value = input.value.trim();

/* ENTER → add keyword */

if (event.key === "Enter") {

event.preventDefault();

if (value === "") return;

keywords.push(value);

renderTags();

input.value = "";

}

/* BACKSPACE → remove last keyword */

if (event.key === "Backspace" && value === "") {

keywords.pop();

renderTags();

}

}


/* Render keyword tags */

function renderTags() {

let container = document.getElementById("keywordTags");

container.innerHTML = "";

keywords.forEach((tag, index) => {

let div = document.createElement("div");

div.className = "tag";

div.innerHTML = `
${tag} <span onclick="removeTag(${index})">✕</span>
`;

container.appendChild(div);

});

}


/* Remove specific tag */

function removeTag(index) {

keywords.splice(index, 1);

renderTags();

}


/* Counter controls */

function changeValue(id, val) {

let input = document.getElementById(id);

let num = parseInt(input.value);

if (isNaN(num)) num = 0;

num += val;

if (num < 1) num = 1;

input.value = num;

}


/* Send data to backend */

async function generateReels(){

let data = {

keywords: keywords,
theme: document.getElementById("theme").value,
duration: parseInt(document.getElementById("duration").value),
num_reels: parseInt(document.getElementById("reels").value)

}

try{

let response = await fetch("http://localhost:8000/generate",{

method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify(data)

})

let result = await response.json()

console.log("Backend response:", result)

}

catch(error){

console.log("Backend not running")

}

}
