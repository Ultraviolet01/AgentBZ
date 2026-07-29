// ScamSniff Background Service Worker
console.log('ScamSniff Background Worker Initialized');

chrome.runtime.onInstalled.addListener(() => {
  console.log('ScamSniff Extension Installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'speak') {
    handleScanAndSpeak(message, sender.tab.id).then(() => sendResponse({ done: true }));
    return true;
  }
});

async function handleScanAndSpeak(message, tabId) {
  try {
    // Stage 1: Get AI-powered security verdict
    const { verdict, cid } = await getVerdict(message.text);
    
    // Stage 2: Synthesis
    await speakText(verdict, tabId);

    // Optional: Log CID for transparency
    if (cid) console.log('ScamSniff Storage Proof (CID):', cid);

  } catch (err) {
    console.error('Scan and Speak failed:', err);
  }
}

// --- CLAUDE RESOLUTION ---

async function getVerdict(pageText) {
  const { claudeKey } = await chrome.storage.local.get('claudeKey');

  if (claudeKey) {
    // Direct Sovereign Path (User Override)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Analyze this webpage content and give a short, clear verdict in 2-3 sentences. 
          Page content: ${pageText.slice(0, 3000)}`
        }]
      })
    });
    const data = await response.json();
    const verdict = data.content[0].text;

    // Asynchronously archive to storage even in Sovereign mode
    const archiveResp = await fetch('http://localhost:3010/api/agents/scamsniff/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        verdict, 
        context: { url: 'captured-via-orb', domain: 'browser-tab' } 
      })
    });
    const archiveData = await archiveResp.json();

    return { verdict, cid: archiveData.storageCid };
  } else {
    // Secure Proxy Path (Default - uses platform credits)
    const response = await fetch('http://localhost:3010/api/agents/scamsniff/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pageContext: { text: pageText, url: 'captured-via-orb', domain: 'browser-tab' } 
      })
    });
    const data = await response.json();
    return { 
      verdict: data.spokenVerdict || "Analysis complete.", 
      cid: data.storageCid 
    };
  }
}

// --- ELEVENLABS RESOLUTION ---

async function speakText(text, tabId) {
  const { elevenLabsKey } = await chrome.storage.local.get('elevenLabsKey');

  if (elevenLabsKey) {
    // Direct Sovereign Path (User Override)
    const VOICE_ID = 'pNInz6obpgUEG0dfLSmR'; // Adam
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });
    const blob = await response.blob();
    streamAudioToTab(blob, tabId);
  } else {
    // Secure Proxy Path (Default)
    const response = await fetch('http://localhost:3010/api/agents/scamsniff/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Voice proxy failed');
    const blob = await response.blob();
    streamAudioToTab(blob, tabId);
  }
}

function streamAudioToTab(blob, tabId) {
  const reader = new FileReader();
  reader.onload = () => {
    chrome.tabs.sendMessage(tabId, { 
      action: 'playAudio', 
      audioData: reader.result 
    });
  };
  reader.readAsDataURL(blob);
}
