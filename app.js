const state = {
    lang: 'zh',
    data: {
        mapping_single: [],
        mapping_double: [],
        solutions: [],
        levels: []
    }
};

const UI = {
    inputSection: document.getElementById('fortune-input-section'),
    resultSection: document.getElementById('fortune-result-section'),
    loader: document.getElementById('loader'),
    input: document.getElementById('lucky-number'),
    revealBtn: document.getElementById('reveal-btn'),
    resetBtn: document.getElementById('reset-btn'),
    resultNumber: document.getElementById('result-number'),
    resultLevel: document.getElementById('result-level'),
    resultText: document.getElementById('result-text'),
    scoreText: document.getElementById('score-text'),
    scoreCircle: document.getElementById('score-circle'),
    langBtns: {
        zh: document.getElementById('lang-zh'),
        en: document.getElementById('lang-en')
    }
};

const texts = {
    zh: {
        title: "探索您的命運",
        subtitle: "輸入您的幸運數字，揭開未來的神秘面紗",
        revealBtn: "揭曉占卜",
        backBtn: "再試一次",
        loading: "正在諮詢神諭...",
        fortuneScore: "運勢評分"
    },
    en: {
        title: "Discover Your Path",
        subtitle: "Enter your lucky number to unveil your destiny",
        revealBtn: "Reveal Fortune",
        backBtn: "Try Again",
        loading: "Consulting the oracles...",
        fortuneScore: "Fortune Score"
    }
};

async function init() {
    try {
        const [mapping_single, mapping_double, solutions, levels] = await Promise.all([
            fetch('data/mapping_single.json').then(r => r.json()),
            fetch('data/mapping_double.json').then(r => r.json()),
            fetch('data/solutions.json').then(r => r.json()),
            fetch('data/levels.json').then(r => r.json())
        ]);

        state.data = { mapping_single, mapping_double, solutions, levels };
        setupEventListeners();
        updateLanguageUI();
    } catch (err) {
        console.error("Failed to load data:", err);
    }
}

function setupEventListeners() {
    UI.revealBtn.addEventListener('click', revealFortune);
    UI.resetBtn.addEventListener('click', resetUI);
    UI.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') revealFortune();
    });

    UI.langBtns.zh.addEventListener('click', () => setLang('zh'));
    UI.langBtns.en.addEventListener('click', () => setLang('en'));
}

function setLang(lang) {
    state.lang = lang;
    UI.langBtns.zh.classList.toggle('active', lang === 'zh');
    UI.langBtns.en.classList.toggle('active', lang === 'en');
    updateLanguageUI();
    if (UI.resultSection.classList.contains('active')) {
        // Refresh current result if language changes
        revealFortune();
    }
}

function updateLanguageUI() {
    const t = texts[state.lang];
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) el.textContent = t[key];
    });
    UI.input.placeholder = state.lang === 'zh' ? "0 - 9999" : "0 - 9999";
}

function revealFortune() {
    const val = UI.input.value;
    if (val === "") return;

    const num = parseInt(val);

    // Show loader
    UI.loader.classList.add('active');

    setTimeout(() => {
        let identifier;

        if (num >= 0 && num <= 99) {
            const entry = state.data.mapping_double.find(i => i.Number === num);
            identifier = entry ? (entry.SingedIdentifier || entry.SignedIdentifier) : null;
        } else if (num >= 0 && num <= 9999) {
            const entry = state.data.mapping_single.find(i => i.Number === num);
            identifier = entry ? entry.SignedIdentifier : null;
        }

        if (identifier) {
            displayResult(num, identifier);
        } else {
            alert("Number out of range (0-9999)");
            UI.loader.classList.remove('active');
            return;
        }

        UI.loader.classList.remove('active');
        switchTo('result');
    }, 1200);
}

function displayResult(num, identifier) {
    const solution = state.data.solutions.find(s => s.Identifier === identifier);
    const level = state.data.levels.find(l => l.Identifier === identifier);

    if (!solution || !level) return;

    const langKey = state.lang === 'zh' ? 'zhHant' : 'en';
    UI.resultNumber.textContent = `#${num.toString().padStart(4, '0')}`;
    UI.resultLevel.textContent = level[langKey] || level['zhHant'];

    const text = solution[langKey] || solution['zhHant'];
    UI.resultText.textContent = text;

    // Extract score from text (e.g., "得分90分" or "得分為90分")
    const scoreMatch = text.match(/(\d+)分/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    animateScore(score);
}

function animateScore(target) {
    let current = 0;
    const duration = 1500;
    const start = performance.now();

    function update(time) {
        const progress = Math.min((time - start) / duration, 1);
        current = Math.floor(progress * target);
        UI.scoreText.textContent = current;
        UI.scoreCircle.style.strokeDasharray = `${current}, 100`;

        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function switchTo(view) {
    if (view === 'result') {
        UI.inputSection.classList.remove('active');
        setTimeout(() => {
            UI.inputSection.style.display = 'none';
            UI.resultSection.style.display = 'block';
            setTimeout(() => UI.resultSection.classList.add('active'), 50);
        }, 600);
    } else {
        UI.resultSection.classList.remove('active');
        setTimeout(() => {
            UI.resultSection.style.display = 'none';
            UI.inputSection.style.display = 'block';
            setTimeout(() => UI.inputSection.classList.add('active'), 50);
        }, 600);
    }
}

function resetUI() {
    UI.input.value = "";
    switchTo('input');
}

init();
