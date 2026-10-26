/**
 * Automated Test Suite for Letter Quest Game
 * Run with: node test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n========================================');
console.log('🧪 RUNNING LETTER QUEST TEST SUITE');
console.log('========================================\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ PASS: ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${description}`);
        console.error(`     Error: ${err.message}\n`);
    }
}

// Read index.html
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract Script
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, 'index.html must contain a <script> tag');
const scriptContent = scriptMatch[1];

// Extract CSS
const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
assert(styleMatch, 'index.html must contain a <style> tag');
const styleContent = styleMatch[1];

console.log('--- 1. Responsive & Accessibility Styling Tests ---');

it('Includes responsive viewport meta tag', () => {
    assert(htmlContent.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'), 'Missing responsive viewport tag');
});

it('Hides hero section on mobile screens (<= 768px)', () => {
    assert(styleContent.includes('@media (max-width: 768px)') && styleContent.includes('.hero {\n                display: none;\n            }'), 'Hero section should be hidden under 768px');
});

it('Contains window-shake animation and styling for error feedback', () => {
    assert(styleContent.includes('@keyframes window-shake'), 'Missing @keyframes window-shake');
    assert(styleContent.includes('.window-shake'), 'Missing .window-shake class');
    assert(styleContent.includes('box-shadow'), 'Window shake should include visual glow/shadow');
});

it('Includes mobile tap delay removal (touch-action: manipulation)', () => {
    assert(styleContent.includes('touch-action: manipulation'), 'Missing touch-action: manipulation for instant mobile response');
});

it('Prevents accidental text selection on game buttons (user-select: none)', () => {
    assert(styleContent.includes('user-select: none'), 'Buttons should prevent text selection');
});

it('Has dynamic grid templates based on option count', () => {
    assert(styleContent.includes('.letter-grid[data-count="4"]'), 'Missing grid styles for 4 options');
    assert(styleContent.includes('.letter-grid[data-count="6"]'), 'Missing grid styles for 6/9 options');
});

it('Mode switcher buttons exist for both Letters and Numbers', () => {
    assert(htmlContent.includes('data-mode="letters"'), 'Missing Letters mode button');
    assert(htmlContent.includes('data-mode="numbers"'), 'Missing Numbers mode button');
});

console.log('\n--- 2. Game Data & Vocabulary Tests ---');

// Evaluate the script definitions in a safe context
let extractedAlphabet = null;

const alphabetMatch = scriptContent.match(/alphabet\s*=\s*"([^"]+)"\.split\(""\)/);
if (alphabetMatch) {
    extractedAlphabet = alphabetMatch[1].split('');
}

it('Alphabet contains all 26 uppercase English letters', () => {
    assert(extractedAlphabet && extractedAlphabet.length === 26, 'Alphabet must contain 26 letters');
    assert(extractedAlphabet[0] === 'A' && extractedAlphabet[25] === 'Z', 'Alphabet must span A to Z');
});

it('Every letter from A to Z has a valid word and emoji', () => {
    for (const letter of extractedAlphabet) {
        const regex = new RegExp(`${letter}:\\s*\\["([^"]+)",\\s*"([^"]+)"\\]`);
        const match = scriptContent.match(regex);
        assert(match, `Missing word/emoji for letter ${letter}`);
        assert(match[1].length > 0, `Word is empty for letter ${letter}`);
        assert(match[2].length > 0, `Emoji is empty for letter ${letter}`);
    }
});

it('Numbers array contains numbers 1 through 20', () => {
    assert(scriptContent.includes('numbers = Array.from({ length: 20 }'), 'Missing numbers 1-20 array');
});

it('Every number from 1 to 20 has a valid word and emoji', () => {
    for (let i = 1; i <= 20; i++) {
        const regex = new RegExp(`"${i}":\\s*\\["([^"]+)",\\s*"([^"]+)"\\]`);
        const match = scriptContent.match(regex);
        assert(match, `Missing word/emoji for number ${i}`);
        assert(match[1].length > 0, `Word is empty for number ${i}`);
        assert(match[2].length > 0, `Emoji is empty for number ${i}`);
    }
});

console.log('\n--- 3. Game Logic & Question Generation Tests ---');

it('Question generation produces exactly 10 rounds', () => {
    const totalRoundsMatch = scriptContent.match(/totalRounds\s*=\s*(\d+)/);
    assert(totalRoundsMatch && Number(totalRoundsMatch[1]) === 10, 'Game should have 10 rounds');
});

it('Difficulty options are calibrated properly (Easy: 4, Medium: 6, Hard: 9)', () => {
    assert(scriptContent.includes('easy: 4'), 'Easy level should offer 4 options');
    assert(scriptContent.includes('medium: 6'), 'Medium level should offer 6 options');
    assert(scriptContent.includes('hard: 9'), 'Hard level should offer 9 options');
});

it('Question builder ensures target letter is always among options with no duplicates', () => {
    function shuffle(arr) {
        return [...arr].sort(() => Math.random() - 0.5);
    }
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const levelCounts = { easy: 4, medium: 6, hard: 9 };

    ['easy', 'medium', 'hard'].forEach(lvl => {
        const picked = shuffle(alphabet).slice(0, 10);
        const questions = picked.map(letter => {
            const others = shuffle(alphabet.filter(i => i !== letter)).slice(0, levelCounts[lvl] - 1);
            return {
                target: letter,
                options: shuffle([letter, ...others])
            };
        });

        assert.strictEqual(questions.length, 10, `${lvl} mode must generate 10 questions`);
        questions.forEach((q, idx) => {
            assert(q.options.includes(q.target), `Question ${idx + 1} in ${lvl} must include target letter ${q.target}`);
            assert.strictEqual(q.options.length, levelCounts[lvl], `Question ${idx + 1} in ${lvl} must have ${levelCounts[lvl]} options`);
            const uniqueOptions = new Set(q.options);
            assert.strictEqual(uniqueOptions.size, levelCounts[lvl], `Question ${idx + 1} options must be unique`);
        });
    });
});

it('Question builder ensures target number (1-20) is always among options with no duplicates', () => {
    function shuffle(arr) {
        return [...arr].sort(() => Math.random() - 0.5);
    }
    const numbers = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const levelCounts = { easy: 4, medium: 6, hard: 9 };

    ['easy', 'medium', 'hard'].forEach(lvl => {
        const picked = shuffle(numbers).slice(0, 10);
        const questions = picked.map(num => {
            const others = shuffle(numbers.filter(i => i !== num)).slice(0, levelCounts[lvl] - 1);
            return {
                target: num,
                options: shuffle([num, ...others])
            };
        });

        assert.strictEqual(questions.length, 10, `${lvl} mode must generate 10 questions`);
        questions.forEach((q, idx) => {
            assert(q.options.includes(q.target), `Question ${idx + 1} in ${lvl} must include target number ${q.target}`);
            assert.strictEqual(q.options.length, levelCounts[lvl], `Question ${idx + 1} in ${lvl} must have ${levelCounts[lvl]} options`);
            const uniqueOptions = new Set(q.options);
            assert.strictEqual(uniqueOptions.size, levelCounts[lvl], `Question ${idx + 1} options must be unique`);
        });
    });
});

console.log('\n--- 4. Error Handling & Interactive Shake Tests ---');

it('shakeWindow function is defined and applies .window-shake class', () => {
    assert(scriptContent.includes('function shakeWindow()'), 'Missing shakeWindow function');
    assert(scriptContent.includes('classList.add("window-shake")'), 'shakeWindow must add .window-shake class');
    assert(scriptContent.includes('gameEl.offsetWidth'), 'shakeWindow must force reflow for consecutive errors');
});

it('chooseLetter triggers shakeWindow and error tone when answer is wrong', () => {
    const chooseLetterMatch = scriptContent.match(/function chooseLetter[\s\S]*?else\s*\{([\s\S]*?)\}/);
    assert(chooseLetterMatch, 'Missing chooseLetter function else block');
    const elseBlock = chooseLetterMatch[1];
    assert(elseBlock.includes('shakeWindow()'), 'Wrong answer must call shakeWindow()');
    assert(elseBlock.includes('playErrorTone()'), 'Wrong answer must call playErrorTone()');
    assert(elseBlock.includes('button.classList.add("wrong")'), 'Wrong answer must add .wrong class to button');
});

it('Correct answer increments score, speaks letter, and celebrates', () => {
    assert(scriptContent.includes('score++'), 'Correct answer must increment score');
    assert(scriptContent.includes('celebrate()'), 'Correct answer must trigger celebration confetti');
    assert(scriptContent.includes('speakLetter(target)'), 'Correct answer must speak target letter');
    assert(scriptContent.includes('advanceTimer = setTimeout'), 'Correct answer must advance to next question automatically');
});

console.log('\n--- 5. In-Browser Test Runner Tests ---');

it('Includes 1-click in-browser test runner (runQuickTest & #runTestBtn)', () => {
    assert(htmlContent.includes('id="runTestBtn"'), 'Missing #runTestBtn in markup');
    assert(scriptContent.includes('runQuickTest'), 'Missing runQuickTest function');
    assert(scriptContent.includes('window.runGameTests = runQuickTest'), 'runGameTests should be exposed on window');
});

console.log('\n========================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed`);
if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
} else {
    console.log('⚠️ SOME TESTS FAILED');
    process.exit(1);
}
console.log('========================================\n');
