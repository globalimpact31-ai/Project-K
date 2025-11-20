/* ZONER GAMES - GAME ENGINE
   This code handles the logic for Reflex, Mind, and Zen zones.
*/

// --- DOM Elements ---
const container = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const htmlArea = document.getElementById('htmlGameArea');
const gameTitle = document.getElementById('game-title');
const gameScoreDisplay = document.getElementById('game-score');
const menu = document.getElementById('game-menu');
const menuTitle = document.getElementById('menu-title');
const menuScore = document.getElementById('menu-score');

let animationFrameId;
let currentGame = null;

// --- Error Handling (Helps debug if something breaks) ---
window.onerror = function(msg, url, line) {
    if(!msg.includes("ResizeObserver")) {
        console.error("Game Error: " + msg + "\nLine: " + line);
    }
};

// --- Game Manager ---
const gameManager = {
    active: false,
    score: 0,
    logicalWidth: 0,
    logicalHeight: 0,
    
    start: function(type) {
        console.log("Starting game:", type);
        this.active = true;
        this.score = 0;
        currentGame = type;
        
        container.style.display = 'flex';
        menu.classList.add('hidden');
        htmlArea.innerHTML = ''; 
        
        if(type === 'reflex') {
            canvas.classList.remove('hidden');
            htmlArea.classList.add('hidden');
            gameTitle.innerText = "NEON AIM";
            gameScoreDisplay.innerText = "Score: 0";
            this.resizeCanvas();
            reflexGame.init();
        } else if (type === 'mind') {
            canvas.classList.add('hidden');
            htmlArea.classList.remove('hidden');
            gameTitle.innerText = "COSMIC MEMORY";
            gameScoreDisplay.innerText = "Moves: 0";
            mindGame.init();
        } else if (type === 'zen') {
            canvas.classList.remove('hidden');
            htmlArea.classList.add('hidden');
            gameTitle.innerText = "FLOW GARDEN";
            gameScoreDisplay.innerText = "Relax";
            this.resizeCanvas();
            zenGame.init();
        }
    },
    
    resizeCanvas: function() {
        // Set internal resolution to match CSS display size for sharpness
        // and to fix mouse coordinate bugs
        const rect = canvas.getBoundingClientRect();
        
        // If rect is 0 (first load invisible), default to window size logic
        const w = rect.width > 0 ? rect.width : window.innerWidth * 0.9;
        const h = rect.height > 0 ? rect.height : window.innerHeight * 0.8;
        
        // High DPI scaling
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        
        // Normalize context scale so we can draw using CSS pixels
        ctx.scale(dpr, dpr);
        
        // Store logical size for game calculations
        this.logicalWidth = w;
        this.logicalHeight = h;
    },

    end: function(finalScoreText, titleText = "Game Over") {
        this.active = false;
        menu.classList.remove('hidden');
        menuTitle.innerText = titleText;
        menuScore.innerText = finalScoreText;
    },

    restart: function() {
        this.start(currentGame);
    },

    close: function() {
        container.style.display = 'none';
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        currentGame = null;
        this.active = false;
    },
    
    updateScore: function(val, prefix="Score: ") {
        this.score = val;
        gameScoreDisplay.innerText = prefix + val;
    }
};

// Update canvas size if window resizes
window.addEventListener('resize', () => {
    if(gameManager.active && currentGame !== 'mind') gameManager.resizeCanvas();
});


// --- Game 1: Reflex (Neon Aim) ---
const reflexGame = {
    targets: [],
    timer: 0,
    gameDuration: 1800, // Approx 30 seconds at 60fps
    
    init: function() {
        this.targets = [];
        this.timer = this.gameDuration;
        
        // CLICK HANDLER WITH COORDINATE FIX
        const clickHandler = (e) => {
            if(!gameManager.active) return;
            
            const rect = canvas.getBoundingClientRect();
            
            // Get correct client coordinates whether touch or mouse
            let clientX, clientY;
            if(e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            // Calculate position relative to the canvas element
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Check hits
            for(let i = this.targets.length - 1; i >= 0; i--) {
                const t = this.targets[i];
                const dist = Math.hypot(t.x - x, t.y - y);
                
                // Hit detection (radius + 15px buffer for easier mobile tapping)
                if(dist < t.radius + 15) {
                    gameManager.updateScore(gameManager.score + 10);
                    this.targets.splice(i, 1);
                    break;
                }
            }
        };
        
        // Remove old listeners to prevent stacking
        canvas.onmousedown = clickHandler;
        canvas.ontouchstart = (e) => { e.preventDefault(); clickHandler(e); };
        
        this.loop();
    },

    loop: function() {
        if (!gameManager.active || currentGame !== 'reflex') return;
        
        // Clear screen
        ctx.clearRect(0, 0, gameManager.logicalWidth, gameManager.logicalHeight);
        
        this.timer--;
        
        // Spawn Logic
        if (this.timer % 40 === 0) {
            const r = 40;
            this.targets.push({
                x: r + Math.random() * (gameManager.logicalWidth - r*2),
                y: r + Math.random() * (gameManager.logicalHeight - r*2),
                radius: r,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                shrink: 0.2
            });
        }
        
        // Draw Targets
        for(let i = this.targets.length - 1; i >= 0; i--) {
            let t = this.targets[i];
            t.radius -= t.shrink;
            
            if(t.radius <= 0) {
                this.targets.splice(i, 1);
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            
            // Center dot
            ctx.beginPath();
            ctx.arc(t.x, t.y, 5, 0, Math.PI*2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
        
        // Timer Bar
        ctx.fillStyle = '#3b82f6';
        const pct = this.timer / this.gameDuration;
        ctx.fillRect(0, gameManager.logicalHeight - 6, pct * gameManager.logicalWidth, 6);

        if(this.timer <= 0) {
            gameManager.end("Final Score: " + gameManager.score);
        } else {
            animationFrameId = requestAnimationFrame(() => this.loop());
        }
    }
};


// --- Game 2: Mind (Memory) ---
const mindGame = {
    items: ['🪐', '🚀', '👽', '☄️', '🌟', '🛸', '🌙', '⚡️'],
    flipped: [],
    matched: [],
    moves: 0,

    init: function() {
        this.moves = 0;
        this.flipped = [];
        this.matched = [];
        
        let deck = [...this.items, ...this.items].sort(() => Math.random() - 0.5);
        htmlArea.innerHTML = '<div class="grid-game-board"></div>';
        const board = htmlArea.querySelector('.grid-game-board');
        
        deck.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.onclick = () => this.flipCard(card);
            board.appendChild(card);
        });
    },

    flipCard: function(card) {
        if(this.flipped.length >= 2 || this.flipped.includes(card) || this.matched.includes(card)) return;

        card.classList.add('flipped');
        card.innerText = card.dataset.emoji; // Show emoji
        this.flipped.push(card);

        if(this.flipped.length === 2) {
            this.moves++;
            gameManager.updateScore(this.moves, "Moves: ");
            setTimeout(() => this.checkMatch(), 800);
        }
    },

    checkMatch: function() {
        if(!gameManager.active) return;
        const [c1, c2] = this.flipped;
        
        if(c1.dataset.emoji === c2.dataset.emoji) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            this.matched.push(c1, c2);
            this.flipped = [];
            if(this.matched.length === this.items.length * 2) {
                gameManager.end(`Completed in ${this.moves} moves!`, "Victory!");
            }
        } else {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            c1.innerText = '';
            c2.innerText = '';
            this.flipped = [];
        }
    }
};


// --- Game 3: Zen (Particles) ---
const zenGame = {
    particles: [],
    hue: 0,
    
    init: function() {
        this.particles = [];
        
        const inputHandler = (e) => {
            if(!gameManager.active) return;
            
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if(e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            for(let i=0; i<3; i++){
                this.particles.push(new this.Particle(x, y, this.hue));
            }
        };

        canvas.onmousemove = inputHandler;
        canvas.ontouchmove = (e) => { e.preventDefault(); inputHandler(e); };
        
        this.loop();
    },

    Particle: class {
        constructor(x, y, hue) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 10 + 2;
            this.speedX = Math.random() * 4 - 2;
            this.speedY = Math.random() * 4 - 2;
            this.color = `hsl(${hue}, 100%, 50%)`;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.1) this.size -= 0.1;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    loop: function() {
        if (!gameManager.active || currentGame !== 'zen') return;

        // Trail effect
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(0, 0, gameManager.logicalWidth, gameManager.logicalHeight);
        
        this.hue += 2;
        
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.particles[i].draw();
            if (this.particles[i].size <= 0.3) {
                this.particles.splice(i, 1);
                i--;
            }
        }
        animationFrameId = requestAnimationFrame(() => this.loop());
    }
};