let keywords = [];

// scroll
function scrollToThemes() {
    document.getElementById("themes").scrollIntoView({ behavior: "smooth" });
}

// theme select
function selectTheme(themeName, presetKeywords) {
    document.getElementById("theme").value = themeName;

    keywords = presetKeywords;
    renderTags();
}

// keyword input
function handleKeyword(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        const input = e.target.value.trim();

        if (input && !keywords.includes(input)) {
            keywords.push(input);
            renderTags();
        }

        e.target.value = "";
    }
}

function renderTags() {
    const tagBox = document.getElementById("keywordTags");
    tagBox.innerHTML = "";

    keywords.forEach(k => {
        const span = document.createElement("span");
        span.className = "tag";
        span.innerText = k;
        tagBox.appendChild(span);
    });
}

// counter
function changeValue(id, delta) {
    const input = document.getElementById(id);
    input.value = Math.max(input.min || 1, Number(input.value) + delta);
}

// API call
async function generateReels() {
    const data = {
        keywords,
        theme: document.getElementById("theme").value,
        duration: document.getElementById("duration").value,
        num_reels: document.getElementById("reels").value
    };

    const res = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("responseBox").innerText = JSON.stringify(result, null, 2);
}