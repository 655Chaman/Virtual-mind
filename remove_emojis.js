const fs = require('fs');
const path = require('path');

// Regex matching most emojis
const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{1F004}-\u{1F0CF}\u{25FB}-\u{25FE}\u{1F004}-\u{1F0CF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}]/gu;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./frontend/src');

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // We also want to remove variation selectors like FE0F
    content = content.replace(emojiRegex, '');
    content = content.replace(/\uFE0F/g, ''); // Remove variation selector 16
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        count++;
        console.log('Cleaned emojis from', file);
    }
});

console.log(`Cleaned ${count} files.`);
