// --- Server & Credentials Configuration ---
const BACKEND_TUNNEL_URL = "https://your-server.com"; 
const GEMINI_API_KEY = "";

let state = {
  isAuthenticated: false,
  user: {
    name: "Anmol Creative",
    email: "creator@reelrunner.ai",
    balance: 5000.00
  },
  activeTab: "templates",
  currentOrder: {
    type: "custom",
    displayName: "Custom Video",
    topic: "Deep-sea exploration in 2050",
    duration: 30,
    baseFee: 150.00,
    ratePerSec: 5.00,
    total: 300.00,
    accentColor: "#8b5cf6"
  },
  galleryItems: [],
  connection: {
    mode: "live",
    endpoint: BACKEND_TUNNEL_URL,
    authToken: GEMINI_API_KEY
  }
};

// Page init
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item, .mobile-nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = item.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Init custom cost calculation
  calculateCustomCost();
});

// Auth flows
const API_BASE = "http://localhost:5000";

function toggleAuthForm(type) {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const alertEl = document.getElementById("auth-alert");

  alertEl.className = "hidden"; // clear alerts
  if (type === "register") {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  } else {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  }
}

function handleLogin() {
  const emailInput = document.getElementById("login-email").value.trim();
  const passwordInput = document.getElementById("login-password").value.trim();
  const alertEl = document.getElementById("auth-alert");

  if (!emailInput || !passwordInput) return;

  alertEl.className = "hidden";

  fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: emailInput, password: passwordInput })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(data => { throw new Error(data.error || "Authentication failed") });
    }
    return res.json();
  })
  .then(data => {
    // Save Ses
    localStorage.setItem("rr_jwt_token", data.token);
    
    state.isAuthenticated = true;
    state.user.id = data.user.id;
    state.user.email = data.user.email;
    state.user.balance = data.user.balance;

    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");

    // Sync profile
    updateUserProfileDisplay();
    fetchReelsHistory();
  })
  .catch(err => {
    console.error("Login connection error:", err);
    alertEl.className = "";
    if (err.message.includes("Failed to fetch")) {
      alertEl.innerHTML = ` <strong>Local Auth Server Offline</strong><br>The database backend (port 5000) is offline. Please run <code>node server.js</code> locally, or use <strong>Demo Guest Mode</strong> below to bypass database validations.`;
    } else {
      alertEl.innerHTML = ` <strong>Authentication Failed</strong><br>${err.message}`;
    }
  });
}

function handleRegister() {
  const emailInput = document.getElementById("register-email").value.trim();
  const passwordInput = document.getElementById("register-password").value.trim();
  const alertEl = document.getElementById("auth-alert");

  if (!emailInput || !passwordInput) return;

  alertEl.className = "hidden";

  fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: emailInput, password: passwordInput })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(data => { throw new Error(data.error || "Registration failed") });
    }
    return res.json();
  })
  .then(data => {
    alertEl.className = "";
    alertEl.style.background = "rgba(16, 185, 129, 0.15)";
    alertEl.style.borderColor = "rgba(16, 185, 129, 0.3)";
    alertEl.style.color = "#10b981";
    alertEl.innerHTML = `<strong>Account Created!</strong><br>User registered successfully. You can now log in.`;
    toggleAuthForm("login");
  })
  .catch(err => {
    console.error("Registration error:", err);
    alertEl.className = "";
    alertEl.style.background = "rgba(239, 68, 68, 0.15)";
    alertEl.style.borderColor = "rgba(239, 68, 68, 0.3)";
    alertEl.style.color = "#ef4444";
    if (err.message.includes("Failed to fetch")) {
      alertEl.innerHTML = ` <strong>Local Auth Server Offline</strong><br>The database backend (port 5000) is offline. Start your Express backend to register users.`;
    } else {
      alertEl.innerHTML = ` <strong>Registration Failed</strong><br>${err.message}`;
    }
  });
}

function bypassLogin() {
  
  localStorage.removeItem("rr_jwt_token");

  state.isAuthenticated = true;
  state.user.id = null;
  state.user.name = "Guest Creator";
  state.user.email = "guest@reelrunner.ai";
  state.user.balance = 5000.00;
  
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("dashboard-section").classList.remove("hidden");
  
  updateUserProfileDisplay();
}

function logout() {
  state.isAuthenticated = false;
  localStorage.removeItem("rr_jwt_token");
  document.getElementById("dashboard-section").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
}

function updateUserProfileDisplay() {
  const displayName = state.user.id ? state.user.email.split('@')[0].toUpperCase() : "GUEST CREATOR";
  document.querySelector(".sidebar-user .user-name").textContent = displayName;
  document.querySelector(".sidebar-user .avatar").textContent = displayName.charAt(0);
  document.getElementById("wallet-balance").textContent = `₹${state.user.balance.toFixed(2)}`;
  document.getElementById("checkout-wallet-balance").textContent = `Account Balance: ₹${state.user.balance.toFixed(2)}`;
  const mobileWallet = document.getElementById("mobile-wallet-balance");
  if (mobileWallet) {
    mobileWallet.textContent = state.user.balance.toFixed(2);
  }
}
 
function topUpWallet() {
  state.user.balance += 2000.00;
  updateUserProfileDisplay();
}

// ================= TAB NAVIGATION =================
function switchTab(tabName) {
  state.activeTab = tabName;
  
  // Update nav item active classes
  const navItems = document.querySelectorAll(".nav-item, .mobile-nav-item");
  navItems.forEach(item => {
    if (item.getAttribute("data-tab") === tabName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
  
  // Hide all views
  document.getElementById("templates-view").classList.add("hidden");
  document.getElementById("custom-view").classList.add("hidden");
  document.getElementById("gallery-view").classList.add("hidden");
  
  // Show active view
  document.getElementById(`${tabName}-view`).classList.remove("hidden");
  
  // Update header text
  const viewTitle = document.getElementById("view-title");
  const viewSubtitle = document.getElementById("view-subtitle");
  
  if (tabName === "templates") {
    viewTitle.textContent = "Video Templates";
    viewSubtitle.textContent = "Select a design to generate instantly";
  } else if (tabName === "custom") {
    viewTitle.textContent = "Custom Video Creator";
    viewSubtitle.textContent = "Configure your topic and duration to generate custom videos";
  } else if (tabName === "gallery") {
    viewTitle.textContent = "My Videos";
    viewSubtitle.textContent = "Archive of your completed videos";
    fetchReelsHistory(); // sync in real-time from SQLite!
    renderGallery();
  }
}

// ================= CUSTOM PRICING ENGINE =================
function updateDurationLabel(val) {
  document.getElementById("duration-val").textContent = `${val}s`;
  document.getElementById("calc-duration").textContent = val;
  calculateCustomCost();
}

function calculateCustomCost() {
  const duration = parseInt(document.getElementById("custom-duration").value);
  const topicInput = document.getElementById("custom-topic").value.trim();
  
  const baseFee = 150.00;
  const durationCost = duration * 5.00;
  const total = baseFee + durationCost;
  
  // Sync state
  state.currentOrder.duration = duration;
  state.currentOrder.total = total;
  state.currentOrder.baseFee = baseFee;
  state.currentOrder.ratePerSec = 5.00;
  state.currentOrder.type = "custom";
  state.currentOrder.displayName = "Custom Video";
  state.currentOrder.topic = topicInput || "Custom Video";
  state.currentOrder.accentColor = "#8b5cf6";
  
  // Update UI
  document.getElementById("calc-duration-cost").textContent = `₹${durationCost.toFixed(2)}`;
  document.getElementById("calc-total").textContent = `₹${total.toFixed(2)}`;
}

// ================= CHECKOUT GATEWAY =================
function selectTemplate(slug, displayName, baseFee, ratePerSec, accentColor) {
  const topics = {
    comedy: "A viral, hilarious meme explaining code bugs in production",
    action: "A rapid cinematic chase in a rainy neon cyberpunk city with drones",
    horror: "Eerie flickering corridors of an abandoned gothic clocktower",
    facts: "Mind-blowing educational secrets about deep ocean trench creatures",
    historic: "An archival vintage sepia overview of ancient Roman colosseum builds",
    science: "Exploring a quantum computing node inside a futuristic reactor room"
  };

  // Compile Order
  state.currentOrder = {
    type: slug,
    displayName: displayName,
    topic: topics[slug] || "Standard video concept",
    duration: 30,
    baseFee: baseFee,
    ratePerSec: ratePerSec,
    total: baseFee + (30 * ratePerSec),
    accentColor: accentColor
  };

  openCheckout();
}

function checkoutCustomSpec() {
  const topicInput = document.getElementById("custom-topic").value.trim();
  if (!topicInput) {
    alert("Please enter a topic for your video!");
    return;
  }
  
  state.currentOrder.topic = topicInput;
  openCheckout();
}

function openCheckout() {
  // Render checkout summary
  document.getElementById("checkout-title").textContent = state.currentOrder.displayName;
  document.getElementById("checkout-topic-val").textContent = state.currentOrder.topic;
  document.getElementById("checkout-duration-text").textContent = `${state.currentOrder.duration} Seconds`;
  document.getElementById("checkout-total-price").textContent = `₹${state.currentOrder.total.toFixed(2)}`;
  
  // Update checkout button
  document.getElementById("pay-submit-btn").innerHTML = `<span>Pay ₹${state.currentOrder.total.toFixed(2)}</span>`;

  // Show modal
  document.getElementById("checkout-modal").classList.remove("hidden");
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.add("hidden");
}

// --- Card formatting functions ---
function formatCardNumber(input) {
  let v = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let matches = v.match(/\d{4,16}/g);
  let match = matches && matches[0] || '';
  let parts = [];

  for (let i=0, len=match.length; i<len; i+=4) {
    parts.push(match.substring(i, i+4));
  }

  if (parts.length > 0) {
    input.value = parts.join(' ');
  } else {
    input.value = v;
  }
}

function formatCardExpiry(input) {
  let v = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    input.value = v.substring(0, 2) + '/' + v.substring(2, 4);
  } else {
    input.value = v;
  }
}

function formatCardCvc(input) {
  input.value = input.value.replace(/[^0-9]/gi, '');
}

// ================= PIPELINE RUN TIME SIMULATOR & LOCAL TUNNEL CONNECTOR =================
let animFrameId = null;
let recordStreamChunks = [];
let canvasRecorder = null;

function triggerPaymentProcessing() {
  const method = document.querySelector('input[name="payment-method"]:checked').value;
  const price = state.currentOrder.total;
  
  if (method === "wallet") {
    if (state.user.balance < price) {
      alert("Insufficient account balance! Please Top Up or pay via Credit Card.");
      return;
    }
    // Deduct
    state.user.balance -= price;
    updateUserProfileDisplay();
  }
  
  closeCheckout();
  
  // Reveal Pipeline compilation tracker
  document.getElementById("pipeline-modal").classList.remove("hidden");
  
  // Start execution
  runPipelineSimulation();
}

function runPipelineSimulation() {
  let percent = 0;
  const percentText = document.getElementById("render-percent");
  
  // Reset all steps UI
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`step-${i}`);
    el.className = "step-row";
  }
  
  document.getElementById("step-0").classList.add("active");

  // Check Connection Mode: Simulated vs Live ML Backend
  if (state.connection.mode === "live") {
    executeLivePipelineFetch(percentText);
    return;
  }
  
  // Simulated Pipeline Timer
  const interval = setInterval(() => {
    percent += 1;
    percentText.textContent = `${percent}%`;
    
    // Handle step state activation
    if (percent === 15) {
      document.getElementById("step-0").className = "step-row done";
      document.getElementById("step-1").className = "step-row active";
    } 
    else if (percent === 35) {
      document.getElementById("step-1").className = "step-row done";
      document.getElementById("step-2").className = "step-row active";
    }
    else if (percent === 55) {
      document.getElementById("step-2").className = "step-row done";
      document.getElementById("step-3").className = "step-row active";
      
      // Start dynamic canvas rendering and record the frames
      startCanvasRecording();
    }
    else if (percent === 80) {
      document.getElementById("step-3").className = "step-row done";
      document.getElementById("step-4").className = "step-row active";
    }
    
    if (percent >= 100) {
      clearInterval(interval);
      document.getElementById("step-4").className = "step-row done";
      
      // Stop recording
      setTimeout(() => {
        stopCanvasRecording();
      }, 600);
    }
  }, 60);
}

// --- Live localtunnel / Pipeline 3-Step Fetch Orchestrator ---
function executeLivePipelineFetch(percentText) {
  let baseUrl = state.connection.endpoint.replace(/\/+$/, "");
  if (baseUrl.endsWith("/generate")) {
    baseUrl = baseUrl.slice(0, -9);
  }

  // Update pipeline UI for step 0
  document.getElementById("step-0").className = "step-row active";
  document.getElementById("step-1").className = "step-row";
  document.getElementById("step-2").className = "step-row";
  document.getElementById("step-3").className = "step-row";
  document.getElementById("step-4").className = "step-row";
  
  percentText.textContent = "0%";

  const payload = {
    topic: state.currentOrder.topic,
    duration: state.currentOrder.duration
  };

  if (state.connection.authToken) {
    payload.gemini_api_key = state.connection.authToken;
  }

  // STEP 1: Launch generation job via POST
  fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true"
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    const jobId = data.job_id;
    if (!jobId) {
      throw new Error("Pipeline initialized successfully but returned no job_id.");
    }

    // Move to step 1 (Connected & Initialized)
    document.getElementById("step-0").className = "step-row done";
    document.getElementById("step-1").className = "step-row active";
    percentText.textContent = "10%";

    // STEP 2: Poll Status every 3 seconds
    let pollInterval = setInterval(() => {
      fetch(`${baseUrl}/status/${jobId}`, {
        headers: {
          "Bypass-Tunnel-Reminder": "true"
        }
      })
      .then(r => {
        if (!r.ok) throw new Error(`Polling status failed with HTTP ${r.status}`);
        return r.json();
      })
      .then(s => {
        // Update status text on loader modal
        const pipelineDesc = document.querySelector(".pipeline-desc");
        if (s.progress) {
          pipelineDesc.textContent = s.progress;
          
          // Parse percentages from progress string if present (e.g. "Encoding 67%")
          const pctMatch = s.progress.match(/(\d+)%/);
          if (pctMatch && pctMatch[1]) {
            percentText.textContent = `${pctMatch[1]}%`;
          } else if (s.progress.toLowerCase().includes("image")) {
            const imgMatch = s.progress.match(/image\s+(\d+)\/(\d+)/i);
            if (imgMatch && imgMatch[1] && imgMatch[2]) {
              const current = parseInt(imgMatch[1]);
              const total = parseInt(imgMatch[2]);
              const estPct = Math.round((current / total) * 75);
              percentText.textContent = `${estPct}%`;
            }
          }
        }

        if (s.status === "done") {
          clearInterval(pollInterval);
          
          document.getElementById("step-1").className = "step-row done";
          document.getElementById("step-2").className = "step-row done";
          document.getElementById("step-3").className = "step-row done";
          document.getElementById("step-4").className = "step-row done";
          percentText.textContent = "100%";

          // STEP 3: Complete & Video Load
          setTimeout(() => {
            percentText.textContent = "95%";
            const pipelineDesc = document.querySelector(".pipeline-desc");
            pipelineDesc.textContent = "Downloading compiled MP4 video from ML host...";

            // Fetch the video file as a binary Blob with the bypass header
            fetch(`${baseUrl}/download/${jobId}`, {
              headers: {
                "Bypass-Tunnel-Reminder": "true"
              }
            })
            .then(res => {
              if (!res.ok) throw new Error(`Video file fetch failed with HTTP ${res.status}`);
              return res.blob();
            })
            .then(blob => {
              document.getElementById("pipeline-modal").classList.add("hidden");

              const localVideoUrl = URL.createObjectURL(blob);
              
              // Mount player
              const outputVideo = document.getElementById("output-video");
              outputVideo.src = localVideoUrl;
              outputVideo.load();
              outputVideo.play();

              const captionEl = document.getElementById("video-overlay-caption");
              captionEl.textContent = state.currentOrder.topic;

              // Bind Downloader to local blob URL!
              const dlBtn = document.getElementById("download-video-btn");
              dlBtn.href = localVideoUrl;
              dlBtn.download = `reel_runner_${state.currentOrder.type}_${jobId}.mp4`;

              // Display JSON
              const specPayload = {
                job_id: jobId,
                topic: state.currentOrder.topic,
                duration: state.currentOrder.duration,
                status: "done",
                download_url: `${baseUrl}/download/${jobId}`
              };
              document.getElementById("json-viewer-content").textContent = JSON.stringify(specPayload, null, 2);

              // Add to gallery history (saves local blob URL so gallery works offline too!)
              saveToGallery(specPayload, localVideoUrl);

              // Show success view
              document.getElementById("success-view").classList.remove("hidden");
            })
            .catch(err => {
              document.getElementById("pipeline-modal").classList.add("hidden");
              showConnectionError(new Error(`Failed to fetch video file from localtunnel: ${err.message}`));
            });
          }, 800);

        } else if (s.status === "error") {
          clearInterval(pollInterval);
          throw new Error(s.progress || "Pipeline job returned an error status.");
        }
      })
      .catch(err => {
        clearInterval(pollInterval);
        document.getElementById("pipeline-modal").classList.add("hidden");
        showConnectionError(err);
      });
    }, 3000);
  })
  .catch(err => {
    document.getElementById("pipeline-modal").classList.add("hidden");
    showConnectionError(err);
  });
}

function showConnectionError(error) {
  const errMsg = error.message || "Unknown error";
  alert(`Connection Error\n\nDetails: ${errMsg}\n\nTroubleshooting:\n1. Check if your generation server is online.\n2. Verify the server address in settings.\n3. Make sure your server allows browser connections.\n4. Inspect server logs for errors.`);
}


// --- Offline Canvas Visualizer & WebM Recorder ---
function startCanvasRecording() {
  const canvas = document.getElementById("render-canvas");
  const ctx = canvas.getContext("2d");
  
  recordStreamChunks = [];
  
  let stream = canvas.captureStream(30);
  let options = { mimeType: "video/webm; codecs=vp9" };
  
  try {
    canvasRecorder = new MediaRecorder(stream, options);
  } catch(e) {
    try {
      options = { mimeType: "video/webm" };
      canvasRecorder = new MediaRecorder(stream, options);
    } catch(err) {
      console.warn("MediaRecorder mime fallback logic applied");
      canvasRecorder = new MediaRecorder(stream);
    }
  }
  
  canvasRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordStreamChunks.push(event.data);
    }
  };
  
  canvasRecorder.start();
  
  const startTime = Date.now();
  const category = state.currentOrder.type;
  const topicWord = state.currentOrder.topic;
  
  let particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      speedY: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 1,
      color: state.currentOrder.accentColor || "#8b5cf6"
    });
  }

  function drawFrame() {
    const elapsed = (Date.now() - startTime) / 1000;
    
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (category === "science") {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, 100 + Math.sin(elapsed * 2) * 10, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.ellipse(canvas.width/2, canvas.height/2, 40, 120, elapsed, 0, Math.PI * 2);
      ctx.ellipse(canvas.width/2, canvas.height/2, 40, 120, -elapsed, 0, Math.PI * 2);
      ctx.stroke();
    } 
    else if (category === "action") {
      const shakeX = (Math.random() - 0.5) * 3;
      const shakeY = (Math.random() - 0.5) * 3;
      ctx.translate(shakeX, shakeY);
    }
    else if (category === "horror") {
      let vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 300);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.9)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    else if (category === "historic") {
      ctx.fillStyle = "rgba(245, 158, 11, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (Math.random() > 0.85) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, 0);
        ctx.lineTo(Math.random() * canvas.width, canvas.height);
        ctx.stroke();
      }
    }
    
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y > canvas.height) {
        p.y = 0;
        p.x = Math.random() * canvas.width;
      }
    });

    ctx.strokeStyle = state.currentOrder.accentColor || "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 140, 0, Math.PI * 2 * (elapsed / 4));
    ctx.stroke();
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Outfit";
    ctx.textAlign = "center";
    ctx.fillText("REEL RUNNER AI", canvas.width / 2, 120);
    
    ctx.fillStyle = state.currentOrder.accentColor || "#8b5cf6";
    ctx.font = "bold 14px Inter";
    ctx.fillText(`${topicWord.toUpperCase().substring(0, 30)}...`, canvas.width / 2, 280);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px Inter";
    ctx.fillText("PIPELINE ENGINE: GEN-V2", canvas.width / 2, 540);
    
    ctx.fillStyle = state.currentOrder.accentColor || "#8b5cf6";
    for(let bar = 0; bar < 10; bar++) {
      const h = Math.abs(Math.sin(elapsed * 4 + bar)) * 40 + 10;
      ctx.fillRect(70 + bar * 22, 480 - h/2, 12, h);
    }
    
    if (category === "action") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    animFrameId = requestAnimationFrame(drawFrame);
  }

  drawFrame();
}

function stopCanvasRecording() {
  if (canvasRecorder) {
    canvasRecorder.stop();
  }
  
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  
  document.getElementById("pipeline-modal").classList.add("hidden");
  
  setTimeout(() => {
    const videoBlob = new Blob(recordStreamChunks, { type: "video/webm" });
    const videoUrl = URL.createObjectURL(videoBlob);
    
    const outputVideo = document.getElementById("output-video");
    outputVideo.src = videoUrl;
    outputVideo.play();
    
    const captionEl = document.getElementById("video-overlay-caption");
    captionEl.textContent = state.currentOrder.displayName;
    captionEl.style.borderLeft = `4px solid ${state.currentOrder.accentColor}`;
    
    const dlBtn = document.getElementById("download-video-btn");
    dlBtn.href = videoUrl;
    dlBtn.download = `reel_runner_${state.currentOrder.type}_${Date.now()}.mp4`;
    
    const jsonPayload = generateJsonSpec();
    const formattedJson = JSON.stringify(jsonPayload, null, 2);
    document.getElementById("json-viewer-content").textContent = formattedJson;
    
    saveToGallery(jsonPayload, videoUrl);

    document.getElementById("success-view").classList.remove("hidden");
  }, 500);
}

// ================= REELS GALLERY STORAGE =================
function fetchReelsHistory() {
  const token = localStorage.getItem("rr_jwt_token");
  if (!token) return;

  fetch(`${API_BASE}/api/reels`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data)) {
      // Re-map SQLite database rows into our gallery template cards
      state.galleryItems = data.map(row => ({
        id: row.id,
        name: `Reel: ${row.topic.substring(0, 20)}${row.topic.length > 20 ? '...' : ''}`,
        duration: row.duration,
        date: new Date(row.created_at).toLocaleDateString(),
        url: row.download_url,
        spec: {
          topic: row.topic,
          duration: row.duration,
          job_id: row.id,
          cost: row.cost
        }
      }));
      renderGallery();
    }
  })
  .catch(err => console.error("Failed to load history from database:", err));
}

function saveToGallery(jsonSpec, videoUrl) {
  const jobId = jsonSpec.job_id || "rr_" + Math.random().toString(36).substring(2, 10);
  
  state.galleryItems.unshift({
    id: jobId,
    name: state.currentOrder.displayName,
    duration: state.currentOrder.duration,
    date: new Date().toLocaleDateString(),
    url: videoUrl,
    spec: jsonSpec
  });

  // If user is authenticated via SQLite database, record transaction and log
  const token = localStorage.getItem("rr_jwt_token");
  if (token) {
    fetch(`${API_BASE}/api/reels/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        jobId: jobId,
        topic: state.currentOrder.topic,
        duration: state.currentOrder.duration,
        cost: state.currentOrder.total,
        downloadUrl: videoUrl
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error("Database log failed:", data.error);
      } else {
        console.log("Logged job in SQLite database successfully!");
        // Update user state balance returned from database
        state.user.balance -= state.currentOrder.total;
        updateUserProfileDisplay();
      }
    })
    .catch(err => console.error("Database logging network error:", err));
  }
}

function renderGallery() {
  const emptyGallery = document.getElementById("empty-gallery");
  const galleryGrid = document.getElementById("gallery-grid");
  
  if (state.galleryItems.length === 0) {
    emptyGallery.classList.remove("hidden");
    galleryGrid.classList.add("hidden");
    return;
  }
  
  emptyGallery.classList.add("hidden");
  galleryGrid.classList.remove("hidden");
  
  galleryGrid.innerHTML = "";
  state.galleryItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    
    const category = item.spec.template || "custom";
    let cardGrad = "linear-gradient(45deg, #27272a, #09090b)";
    if (category === "comedy") cardGrad = "linear-gradient(45deg, #064e3b, #09090b)";
    if (category === "action") cardGrad = "linear-gradient(45deg, #7f1d1d, #09090b)";
    if (category === "horror") cardGrad = "linear-gradient(45deg, #2e1065, #09090b)";
    if (category === "science") cardGrad = "linear-gradient(45deg, #164e63, #09090b)";
    
    card.innerHTML = `
      <div class="gallery-thumb" style="background: ${cardGrad}">
        <svg class="gallery-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="dur-tag">${item.duration}s</span>
      </div>
      <div class="gallery-info">
        <h4>${item.name}</h4>
        <div class="gallery-meta">
          <span>${item.date}</span>
          <span style="color: #10b981; font-weight: 600;">ID: ${item.id.substring(0, 10)}</span>
        </div>
        <button class="btn btn-secondary btn-xs btn-block" style="margin-top: 10px;" onclick="replayGalleryItem('${item.id}')">Watch & Download</button>
      </div>
    `;
    galleryGrid.appendChild(card);
  });
}

function replayGalleryItem(id) {
  const item = state.galleryItems.find(i => i.id === id);
  if (!item) return;
  
  const outputVideo = document.getElementById("output-video");
  outputVideo.src = item.url;
  outputVideo.play();
  
  const captionEl = document.getElementById("video-overlay-caption");
  captionEl.textContent = item.spec.topic || item.name;
  
  const dlBtn = document.getElementById("download-video-btn");
  dlBtn.href = item.url;
  dlBtn.download = `reel_runner_${item.id}.mp4`;
  
  document.getElementById("json-viewer-content").textContent = JSON.stringify(item.spec, null, 2);
  
  document.getElementById("success-view").classList.remove("hidden");
}

function closeSuccessView() {
  document.getElementById("success-view").classList.add("hidden");
  
  const outputVideo = document.getElementById("output-video");
  outputVideo.pause();
  
  if (state.currentOrder.type === "custom") {
    switchTab("gallery");
  } else {
    switchTab("templates");
  }
}
