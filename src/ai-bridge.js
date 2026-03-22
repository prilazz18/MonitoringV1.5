import { getCasesData } from './cases.js';

/**
 * AI_CHATBRIDGE_v1.0 (Cognitive Judicial Assistant)
 * Optimized for natural language statistical analysis and record retrieval.
 */

export function setupAIBridge() {
    const chatBtn = document.getElementById('ai-chat-btn');
    const chatPanel = document.getElementById('ai-chat-panel');
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');
    const chatLog = document.getElementById('ai-chat-log');
    const closeChat = document.getElementById('close-ai-chat');

    if (!chatBtn || !chatPanel || !chatForm || !chatLog) return;

    chatBtn.onclick = () => {
        chatPanel.classList.toggle('active');
        if (chatPanel.classList.contains('active')) {
            const count = getCasesData().filter(c => !c.isEvent).length;
            addAIMessage(`⚖️ Greetings! I am **Clerky**, your Branch 77 assistant. I've indexed **${count}** case records. How can I help you today?`);
            chatInput.focus();
        }
    };

    closeChat.onclick = () => chatPanel.classList.remove('active');

    chatForm.onsubmit = (e) => {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;

        addMessage(query, 'user');
        chatInput.value = '';
        
        // Simulate judicial processing
        showThinking();
        setTimeout(() => processAIQuery(query), 800);
    };

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `chat-msg msg-${type}`;
        msg.innerHTML = `<div class="msg-content">${text}</div>`;
        chatLog.appendChild(msg);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function addAIMessage(text) {
        addMessage(text, 'ai');
    }

    function showThinking() {
        const thinking = document.createElement('div');
        thinking.id = 'ai-thinking';
        thinking.className = 'chat-msg msg-ai';
        thinking.innerHTML = `<div class="msg-content"><div class="dots-container"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`;
        chatLog.appendChild(thinking);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    const LEGAL_DICTIONARY = {
        'active': 'A case currently undergoing judicial proceedings or waiting for scheduled hearings.',
        'disposed': 'A matter that has reached a final judgment, dismissal, or resolution by the court.',
        'archived': 'Records moved to permanent storage after long-term inactivity or completion of all legal requirements.',
        'appeal': 'A process where a higher court reviews the decision of a lower court for legal errors.',
        'complainant': 'The party who brings a legal complaint against another in a court of law.',
        'respondent': 'The party against whom a petition or complaint is filed, often referred to as the accused in criminal matters.',
        'docket': 'The official summary of proceedings and documents in a legal case.',
        'gavel': 'A ceremonial mallet used by a presiding officer or judge to signal for order or to mark a decision.'
    };

    let indexedDictionary = null;
    let isAIAuthorized = false; // RE-ENABLED: Judicial Guard Sensor Active
    let lastAIIntent = null; 
    let lastAnalyzedTerm = null;
    const JUDICIAL_SECRET = "admin123"; 

    // SENSITIVE NATURES & SYSTEM WIPERS
    const SENSITIVE_TERMS = ['murder', 'homicide', 'rape', 'sexual', 'abuse', 'drug', 'theft', 'kill', 'violence'];
    const WIPE_WORDS = ['reset', 'remove', 'delete', 'back to zero', 'start fresh', 'clear chat', 'wipe'];

    function isSensitive(q) {
        return SENSITIVE_TERMS.some(t => q.toLowerCase().includes(t));
    }

    // ... (rest of setup)

    // Fuzzy Search Helper: Levenshtein Distance
    function convertWordsToDigits(str) {
        const words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'hundred': '*100', 'thousand': '*1000'
        };
        let out = str.toLowerCase();
        Object.keys(words).forEach(w => out = out.replace(new RegExp(`\\b${w}\\b`, 'g'), words[w]));
        return out;
    }

    function getEditDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    async function loadJudicialLexicon() {
        if (indexedDictionary) return;
        try {
            const response = await fetch('LAw Dictionary.txt');
            const text = await response.text();
            const lines = text.split('\n');
            const index = {};
            let currentWord = null;

            lines.forEach((line, i) => {
                const trimmed = line.trim();
                // Detected word headers (ALL CAPS, usually at start of line)
                if (trimmed.length > 1 && trimmed === trimmed.toUpperCase() && !trimmed.includes('  ')) {
                    const cleaned = trimmed.replace(/[^A-Z\s]/g, '');
                    currentWord = cleaned;
                    index[cleaned.toLowerCase()] = { line: i, content: [] };
                } else if (currentWord && trimmed.length > 0) {
                    index[currentWord.toLowerCase()].content.push(trimmed);
                }
            });
            indexedDictionary = index;
            console.log("Judicial Lexicon Indexed: " + Object.keys(index).length + " terms found.");
        } catch (e) {
            console.error("Lexicon Linkage Failed:", e);
        }
    }

    function processAIQuery(query) {
        const thinking = document.getElementById('ai-thinking');
        if (thinking) thinking.remove();

        const q = query.toLowerCase().trim();
        const pq = convertWordsToDigits(q); // Pre-processed for math/dates
        const cases = getCasesData().filter(c => !c.isEvent);

        // 0. SYSTEM WIPE (JUDICIAL LOG SCRUB)
        if (WIPE_WORDS.some(w => q === w || q.includes(w))) {
             chatLog.innerHTML = '';
             isAIAuthorized = false;
             lastAIIntent = null;
             lastAnalyzedTerm = null;
             return addAIMessage(`🧹 **JUDICIAL LOG SCRUBBED.** All session data, intent memory, and clearance levels have been reset to zero. \n\nI am **Clerky**, ready for a fresh administrative session. How may I assist the court?`);
        }

        // 1. CONTEXTUAL CONVERSATION (YES/NO Handling) - PRIORITIZED
        if (lastAIIntent === 'explain_simpler' || lastAIIntent === 'pull_nature_summary') {
            const affirmative = ['yes', 'yup', 'sure', 'ok', 'please', 'do it'];
            if (affirmative.some(w => q === w || q.includes(w))) {
                if (lastAIIntent === 'explain_simpler' && indexedDictionary && lastAnalyzedTerm) {
                    const match = indexedDictionary[lastAnalyzedTerm];
                    const validLines = match.content.filter(line => line.trim().length > 3);
                    const simpleText = validLines.length > 0 ? validLines[0].trim() : "No specific plain-text summary available.";
                    lastAIIntent = null; 
                    return addAIMessage(`⚖️ **CLERKY'S SIMPLIFIED SUMMARY [${lastAnalyzedTerm.toUpperCase()}]:**\n\nBasically, this refers to: **"${simpleText}"**.\n\n*Does this clear the matter for the court?*`);
                }
                if (lastAIIntent === 'pull_nature_summary' && lastAnalyzedTerm) {
                    const targetTokens = lastAnalyzedTerm.toLowerCase().split(/\s+/);
                    const matches = cases.filter(c => {
                        const searchBox = (String(c.nature || '') + " " + String(c.title || '') + " " + String(c.comments || '')).toLowerCase();
                        const searchWords = searchBox.split(/[^a-z0-9]/).filter(w => w.length > 1);
                        return targetTokens.every(token => 
                            searchBox.includes(token) || 
                            searchWords.some(w => getEditDistance(token, w) <= 2)
                        );
                    });
                    
                    lastAIIntent = null;
                    const items = matches.slice(0, 15).map(m => `• ${m.caseNo}: ${m.title}`).join('\n');
                    const more = matches.length > 15 ? `\n*...and ${matches.length - 15} other records available.*` : "";
                    return addAIMessage(`⚖️ **OFFICIAL JUDICIAL SUMMARY [${lastAnalyzedTerm.toUpperCase()}]:**\n\nThe court has identified the following **${matches.length}** records:\n\n${items}${more}`);
                }
            } else if (q.includes('no') || q.includes('remove') || q.includes('sensor')) {
                lastAIIntent = null;
                return addAIMessage("Understood. For the record, I have acknowledged your request. If you require me to bypass the **Judicial Guard**, remember that the Administrative Passcode is **admin123**.");
            }
        }

        // 2. ADMINISTRATIVE CALCULATOR (JUDICIAL COMPUTATION)
        if (pq.includes('calculate') || pq.includes('math') || (pq.match(/[0-9]/) && pq.match(/[\+\-\*\/]/))) {
             const mathExpr = pq.replace(/calculate|math|what is|how much is|result of|times/gi, '')
                                .replace(/plus/gi, '+').replace(/minus/gi, '-')
                                .replace(/divided by/gi, '/').replace(/x/gi, '*')
                                .trim();
             try {
                // Sanitizing to prevent JS execution but allow math
                const sanitized = mathExpr.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
                const result = eval(sanitized); // Standard for simple calc
                if (typeof result === 'number' && !isNaN(result)) {
                     return addAIMessage(`⚖️ **JUDICIAL COMPUTATION RESULT:**\n\nThe administrative calculation for "**${mathExpr}**" resulted in:\n\n### **${result.toLocaleString()}**\n\n*Clerky Note: Ensure all judicial fees are cross-referenced with official guidelines.*`);
                }
             } catch (e) { /* fall through if fails */ }
        }

        // 2.5 JUDICIAL DATE CALCULATOR (TIMELINE COMPUTATION)
        if ((pq.includes('days') || pq.includes('months')) && (pq.includes('after') || pq.includes('from') || pq.includes('before'))) {
             const daysMatch = pq.match(/(\d+)\s*days?/);
             if (daysMatch) {
                 const days = parseInt(daysMatch[1]);
                 const dateStr = pq.replace(/.*(?:after|from|before)\s*/, '').trim();
                 const baseDate = new Date(dateStr);
                 
                 if (!isNaN(baseDate.getTime())) {
                     const resultDate = new Date(baseDate);
                     if (pq.includes('before')) resultDate.setDate(resultDate.getDate() - days);
                     else resultDate.setDate(resultDate.getDate() + days);
                     
                     const options = { year: 'numeric', month: 'long', day: 'numeric' };
                     const formattedDate = resultDate.toLocaleDateString('en-US', options);
                     return addAIMessage(`⚖️ **OFFICIAL JUDICIAL DEADLINE:**\n\nThe projected filing deadline for **${days} days** ${pq.includes('before') ? 'before' : 'after'} "**${baseDate.toLocaleDateString('en-US', options)}**" is:\n\n<div class="deadline-badge">${formattedDate}</div>\n\n*Clerky Note: Always verify if this deadline falls on a weekend or a legal holiday.*`);
                 }
             }
        }

        // 3. CLEARANCE & IDENTITY
        if (!isAIAuthorized && q === JUDICIAL_SECRET.toLowerCase()) {
            isAIAuthorized = true;
            return addAIMessage("👑 **Judicial Clearance Granted.** System decrypted. You now have full administrative access to all sensitive docket records. How may I serve the court?");
        }
        if (q.includes('who are you') || q.includes('your name') || q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
            return addAIMessage("⚖️ Greetings! I am **Clerky**, your digital Judicial Assistant for Branch 77. I can **analyze cases**, **draft memos**, or **research laws**. How may I help you?");
        }
        if (q.includes('owner') || q.includes('master') || q.includes('programmer')) {
            return addAIMessage("I am the creation of **Master Jazzam**, the Programmer and Principal Architect behind this system. I operate under his definitive code for RTC Branch 77.");
        }
        if (q.includes('cost') || q.includes('price') || q.includes('how much is this')) {
            return addAIMessage("Clerky is currently a **Bespoke Pro-Bono Integration** developed exclusively for the Presiding Judge and Staff of RTC Branch 77. Its value is represented by the 180,000+ legal terms indexed and the increased efficiency of your 681+ case records. For licensing inquiries, please consult with **Master Jazzam**.");
        }
        if (q.includes('thanks') || q.includes('good job')) {
            return addAIMessage("It is my professional duty to provide quality assistance. What else do you require?");
        }

        // 3. GENERATIVE DRAFTING & STATS
        if (q.includes('draft') || q.includes('write')) {
            if (!isAIAuthorized) return addAIMessage("🛑 **ADMINISTRATIVE SECURITY LOCK:** Clearance required to draft documents.");
            const target = q.replace(/draft a|write a|memo|letter|for|about/gi, '').trim();
            const match = cases.find(c => c.caseNo.toLowerCase().includes(target) || c.title.toLowerCase().includes(target));
            if (match) return addAIMessage(`⚖️ **CLERKY'S DRAFTING ENGINE:**\n\n**RE:** Case Review - ${match.caseNo}\n**Title:** ${match.title}\n**Status:** ${match.status.toUpperCase()}\n\nNotes: ${match.comments || 'No active notes.'}`);
        }
        if (q.includes('summary') || q.includes('report') || q.includes('how are we doing') || q.includes('how many') || q.includes('total')) {
             if (isSensitive(q) && !isAIAuthorized) return addAIMessage("🛑 **ADMINISTRATIVE SECURITY LOCK:** Access to inquiries for sensitive criminal natures requires clearance. Please provide the passcode.");
             
             const active = cases.filter(c => c.status === 'Active').length;
             const disposed = cases.filter(c => c.status === 'Disposed').length;
             
             if (q.includes('how many') || q.includes('total')) {
                // COLLAPSE SPACES and TOKENIZE target
                const raw = q.replace(/how many|total|nature of|nature|cases|case|of|for|about|in/gi, '').trim();
                const targetTokens = raw.toLowerCase().split(/\s+/).filter(t => t.length > 1);
                const targetLabel = targetTokens.join(' ');
                
                const matches = cases.filter(c => {
                    const searchBox = (String(c.nature || '') + " " + String(c.title || '') + " " + String(c.comments || '')).toLowerCase();
                    const searchWords = searchBox.split(/[^a-z0-9]/).filter(w => w.length > 1);
                    return targetTokens.every(token => 
                        searchBox.includes(token) || 
                        searchWords.some(w => getEditDistance(token, w) <= 2)
                    );
                });
                
                lastAIIntent = 'pull_nature_summary';
                lastAnalyzedTerm = targetLabel;
                
                return addAIMessage(`⚖️ **JUDICIAL COUNT [${targetLabel.toUpperCase()}]:**\n\nThe Branch 77 index identifies **${matches.length}** official records related to **"${targetLabel}"** (including typo-tolerant matches).\n\n*Would you like me to pull the specific summary for these records?*`);
             }
             
             return addAIMessage(`**CLERKY'S DOCKET ANALYSIS:**\n\nIndexed Records: **${cases.length}**\nActive: ${active} | Disposed: ${disposed}\n\n*Recommendation: Excellent efficiency. Continue monitoring older active tracks.*`);
        }

        // 4. DICTIONARY & FULL TEXT SCOURING (DEEP KNOWLEDGE)
        if (q.includes('meaning of') || q.includes('define') || q.includes('search in the text') || q.includes('search the dictionary')) {
            if (isSensitive(q) && !isAIAuthorized) return addAIMessage("🛑 **ADMINISTRATIVE SECURITY LOCK:** Administrative clearance required for sensitive legal definitions. Please provide the passcode.");
            const term = q.replace(/what is a|what is the|what is|define|meaning of|search in the text document for|search the dictionary for|search in the text/gi, '').trim();
            if (indexedDictionary) {
                // Check for Direct Entry first
                let match = indexedDictionary[term] || Object.keys(indexedDictionary).find(k => getEditDistance(term, k) <= 1 && (match = indexedDictionary[k]));
                
                if (q.includes('search in the text') || q.includes('search the dictionary')) {
                    // Full Text Scouring Logic
                    const results = [];
                    Object.keys(indexedDictionary).forEach(key => {
                        const entry = indexedDictionary[key];
                        const text = entry.content.join(' ').toLowerCase();
                        if (text.includes(term)) results.push(key.toUpperCase());
                    });
                    
                    if (results.length > 0) {
                        return addAIMessage(`🔍 **LEXICON FULL-TEXT SCAN [${term.toUpperCase()}]:**\n\nThe term appears in the context of **${results.length}** unique dictionary entries, including:\n\n• ${results.slice(0, 5).join('\n• ')}\n\n*Would you like me to pull the specific definition for any of these?*`);
                    }
                    return addAIMessage(`Scan Complete: No mentions of "**${term}**" found in the text document.`);
                }
                
                if (match) {
                    lastAIIntent = 'explain_simpler';
                    lastAnalyzedTerm = term;
                    return addAIMessage(`📘 **CLERKY'S KNOWLEDGE BASE [${term.toUpperCase()}]:**\n\n${match.content.slice(0, 6).join(' ')}...\n\n*Would you like me to explain this in simpler terms for the court?*`);
                }
            }
        }

        // 5. JUDICIAL SEARCH (GUARDED)
        const isSearch = ['search', 'find', 'case', 'lookup', 'details', 'look', 'decision'].some(w => q.includes(w));
        const isTitle = q.includes('vs') || q.includes('versus') || q.includes(' v ');
        if (isSearch || isTitle || (q.length > 3 && !q.startsWith('how ') && !q.startsWith('what '))) {
            if (!isAIAuthorized) return addAIMessage("🛑 **ADMINISTRATIVE SECURITY LOCK:** Passcode required to unlock sensitive docket records.");
            let scrub = q.replace(/(can you|give me|tell me|search for|case no|about|find|case|of|versus|\bvs\b\.|\bvs\b|\bv\b\.|\bv\b)/gi, '').trim();
            if (scrub.length < 2) return addAIMessage("Error: Provide at least 2 identifiers.");
            const stopwords = ['of', 'the', 'a', 'an', 'and', 'for', 'in', 'on', 'with', 'at', 'by'];
            const tokens = scrub.split(/\s+/).filter(t => t.length > 1 && !stopwords.includes(t));
            const matches = cases.filter(c => {
                const target = `${c.caseNo} ${c.title} ${c.complainant} ${c.respondent} ${c.status} ${c.comments}`.toLowerCase();
                const targetWords = target.split(/[^a-z0-9]/).filter(w => w.length > 1);
                return tokens.every(token => target.includes(token) || targetWords.some(w => getEditDistance(token, w) <= 1));
            });

            if (matches.length === 0) {
                // AUTO CROSS-REFERENCE WITH DICTIONARY
                if (indexedDictionary && (indexedDictionary[scrub] || Object.keys(indexedDictionary).find(k => getEditDistance(scrub, k) <= 1))) {
                    return addAIMessage(`⚖️ **JUDICIAL CROSS-REFERENCE:**\n\nI did not find a case record for "**${scrub}**" in the Branch 77 docket. However, this term exists in the **Judicial Lexicon**. \n\n*Would you like me to pull the legal definition for the court?*`);
                }
                return addAIMessage(`Scan Complete: No records found for "**${scrub}**".`);
            }
            if (matches.length === 1) {
                const c = matches[0];
                return addAIMessage(`**RETRIEVAL SUCCESSFUL:**\n\n**Case:** ${c.caseNo}\n**Title:** ${c.title}\n**Status:** ${c.status.toUpperCase()}\n**Note:** ${c.comments || 'N/A'}`);
            }
            return addAIMessage(`Found **${matches.length}** records. Please specify:\n\n` + matches.map(r => `• ${r.caseNo}: ${r.title}`).join('\n'));
        }

        // 6. FINAL FALLBACK
        addAIMessage(`I am **Clerky**, your Generative assistant. I didn't catch that command. Try:\n\n• *"Draft a memo for case X"*\n• *"Give me a summary report"*\n• *"Define [Legal Term]"*`);
    }

    // Trigger Lexicon Load
    loadJudicialLexicon();
}
