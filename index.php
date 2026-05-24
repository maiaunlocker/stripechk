<?php
// index.php - VERSÃO FINAL LIMPA (SEM BOTÃO DE LOG)
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VBV CHECKER 2025</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a1a, #1a1a3a, #0a0a2a);
            color: #0ff;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            padding: 20px;
        }
        .card-custom {
            background: rgba(10, 15, 40, 0.85);
            border: 2px solid #0ff;
            box-shadow: 0 0 20px #0ff;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
        }
        textarea {
            background: rgba(0,0,0,0.8) !important;
            border: 2px solid #0ff !important;
            color: #0f0 !important;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            resize: vertical;
        }
        textarea:focus { box-shadow: 0 0 15px #0ff !important; }
        .btn-start {
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000;
            font-weight: 900;
            border: none;
            padding: 15px;
            border-radius: 50px;
            box-shadow: 0 0 30px #0f0;
            width: 100%;
            cursor: pointer;
            font-size: 16px;
            letter-spacing: 2px;
            transition: all 0.3s;
        }
        .btn-start:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 0 50px #0f0; }
        .btn-start:disabled { background: #555; box-shadow: none; cursor: not-allowed; }
        .btn-stop {
            background: linear-gradient(45deg, #ff0000, #cc0000);
            color: #fff;
            font-weight: 900;
            border: none;
            padding: 15px;
            border-radius: 50px;
            box-shadow: 0 0 30px #f00;
            width: 100%;
            cursor: pointer;
            font-size: 16px;
            letter-spacing: 2px;
            display: none;
            transition: all 0.3s;
        }
        .btn-stop:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 0 50px #f00; }
        .btn-stop:disabled { background: #555; box-shadow: none; cursor: not-allowed; }
        .result-box {
            background: rgba(0,0,0,0.9);
            border: 1px solid #0ff;
            border-radius: 10px;
            min-height: 250px;
            max-height: 500px;
            padding: 15px;
            overflow-y: auto;
            font-size: 12px;
        }
        .live { color: #0f0; }
        .dead { color: #f00; }
        .processing { color: #ff0; }
        .counter {
            background: #000;
            color: #0ff;
            padding: 5px 15px;
            border-radius: 50px;
            border: 1px solid #0ff;
            font-weight: bold;
            display: inline-block;
        }
        h1 {
            font-weight: 900;
            text-shadow: 0 0 20px #0ff, 0 0 40px #0ff;
            letter-spacing: 3px;
            text-align: center;
        }
        .result-line {
            border-bottom: 1px solid rgba(0,255,255,0.15);
            padding: 10px 0;
            margin: 2px 0;
            line-height: 1.6;
        }
        .time-badge {
            background: #222;
            color: #0ff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-left: 8px;
        }
        .section-title {
            color: #0ff;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .progress-bar-custom {
            height: 5px;
            background: #333;
            border-radius: 5px;
            margin: 10px 0;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #0ff, #0f0);
            width: 0%;
            transition: width 0.3s;
            border-radius: 5px;
        }
        .status-text {
            font-size: 12px;
            margin-top: 5px;
            text-align: center;
        }
        #status-bar {
            background: rgba(0,0,0,0.5);
            border: 1px solid #ff0;
            border-radius: 10px;
            padding: 10px;
            margin: 10px 0;
            display: none;
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ff0;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .details-text {
            color: #ff0;
            font-size: 11px;
            margin-top: 5px;
            padding: 8px;
            background: rgba(255,255,0,0.05);
            border-left: 2px solid #ff0;
            border-radius: 3px;
            white-space: pre-line;
        }
    </style>
</head>
<body>
<div class="container">
    <h1 class="mb-4">🔥 VBV CHECKER 2025 🔥</h1>
    
    <div class="card-custom">
        <textarea id="cardsInput" class="form-control" rows="8" placeholder="5122672265529113|10|30|001
5122672265529113|10|30|002
5122672265529113|10|30|003"></textarea>
        <div class="row mt-3">
            <div class="col-md-6">
                <button class="btn-start" id="btnStart" onclick="startCheck()">
                    ⚡ INICIAR CHECK ⚡
                </button>
                <button class="btn-stop" id="btnStop" onclick="stopCheck()">
                    ⏹️ PARAR
                </button>
            </div>
            <div class="col-md-6">
                <div class="progress-bar-custom">
                    <div class="progress-fill" id="progressBar"></div>
                </div>
                <div class="status-text" id="statusText">Aguardando...</div>
            </div>
        </div>
    </div>

    <div id="status-bar">
        <span class="spinner"></span>
        <span class="processing">⏳ Testando: <strong><span id="currentCard"></span></strong></span>
        <span style="float:right;color:#aaa;" id="progressText">0/0</span>
    </div>

    <div class="row">
        <div class="col-md-6 mb-3">
            <div class="section-title">
                <span class="counter" id="live-count">0</span> 
                <span class="live">✅ LIVE VBV</span>
            </div>
            <div class="result-box live" id="liveResults">
                <div style="color:#555;text-align:center;padding-top:50px;">Nenhum LIVE ainda</div>
            </div>
        </div>
        <div class="col-md-6 mb-3">
            <div class="section-title">
                <span class="counter" id="dead-count">0</span> 
                <span class="dead">❌ RECUSADA</span>
            </div>
            <div class="result-box dead" id="deadResults">
                <div style="color:#555;text-align:center;padding-top:50px;">Nenhum DEAD ainda</div>
            </div>
        </div>
    </div>
</div>

<script>
let isRunning = false;
let stopRequested = false;
let liveCount = 0;
let deadCount = 0;
let cards = [];
let currentIndex = 0;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function checkCard(card) {
    const params = new URLSearchParams();
    params.append('card', card);
    
    const response = await fetch('check.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params.toString()
    });
    
    const data = await response.json();
    
    if (data.hash) {
        for (let i = 0; i < 90; i++) {
            await new Promise(r => setTimeout(r, 1000));
            
            const pollResp = await fetch(`check.php?hash=${data.hash}`);
            const pollData = await pollResp.json();
            
            if (pollData.status !== 'WAIT') {
                return pollData;
            }
        }
        return { status: 'RECUSADA', message: 'Timeout (90s)' };
    }
    
    return data;
}

function addResult(card, status, message, elapsed) {
    const isLive = status === 'LIVE VBV';
    const target = document.getElementById(isLive ? 'liveResults' : 'deadResults');
    
    // Limpar mensagem inicial
    if ((isLive && liveCount === 0) || (!isLive && deadCount === 0)) {
        target.innerHTML = '';
    }
    
    const div = document.createElement('div');
    div.className = 'result-line';
    
    // Formatar mensagem - remover prefixos e mostrar detalhes
    let displayMessage = message;
    let detailsHtml = '';
    
    // Se a mensagem contém quebra de linha (detalhes do 3DS)
    if (message.includes('\n📋 ')) {
        const parts = message.split('\n📋 ');
        displayMessage = parts[0]; // "✅ LIVE - Autorização de Compra"
        if (parts[1]) {
            detailsHtml = `<div class="details-text">📋 ${escapeHtml(parts[1])}</div>`;
        }
    }
    
    div.innerHTML = `
        <strong style="color:#fff;">${escapeHtml(card)}</strong><br>
        → <span class="${isLive ? 'live' : 'dead'}"><strong>${isLive ? '✅ LIVE VBV' : '❌ RECUSADA'}</strong></span>
        <span class="time-badge">${elapsed}s</span><br>
        <small style="color:#aaa;">${escapeHtml(displayMessage)}</small>
        ${detailsHtml}
    `;
    
    target.appendChild(div);
    target.scrollTop = target.scrollHeight;
    
    if (isLive) {
        liveCount++;
        document.getElementById('live-count').innerText = liveCount;
    } else {
        deadCount++;
        document.getElementById('dead-count').innerText = deadCount;
    }
}

function updateProgress() {
    const total = cards.length;
    const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('statusText').innerText = `${currentIndex}/${total} cartões testados`;
}

async function startCheck() {
    if (isRunning) return;
    
    const input = document.getElementById('cardsInput').value.trim();
    if (!input) {
        alert('Cole os cartões primeiro!');
        return;
    }
    
    cards = input.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '' && line.includes('|'));
    
    if (cards.length === 0) {
        alert('Nenhum cartão válido encontrado!\nFormato: NUM|MES|ANO|CVV');
        return;
    }
    
    // Reset
    currentIndex = 0;
    liveCount = 0;
    deadCount = 0;
    stopRequested = false;
    isRunning = true;
    
    document.getElementById('liveResults').innerHTML = '<div style="color:#555;text-align:center;padding-top:50px;">Nenhum LIVE ainda</div>';
    document.getElementById('deadResults').innerHTML = '<div style="color:#555;text-align:center;padding-top:50px;">Nenhum DEAD ainda</div>';
    document.getElementById('live-count').innerText = '0';
    document.getElementById('dead-count').innerText = '0';
    
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnStop').style.display = 'block';
    document.getElementById('btnStop').disabled = false;
    document.getElementById('btnStop').innerText = '⏹️ PARAR';
    document.getElementById('status-bar').style.display = 'block';
    document.getElementById('statusText').innerText = 'Iniciando...';
    document.getElementById('progressBar').style.width = '0%';
    
    for (let i = 0; i < cards.length; i++) {
        if (stopRequested) {
            document.getElementById('statusText').innerText = 'Interrompido!';
            break;
        }
        
        currentIndex = i + 1;
        const card = cards[i];
        
        const cardDisplay = card.substring(0, 6) + '...' + card.substring(card.length - 4);
        document.getElementById('currentCard').innerText = cardDisplay;
        document.getElementById('progressText').innerText = `${i+1}/${cards.length}`;
        updateProgress();
        
        const start = Date.now();
        
        try {
            const result = await checkCard(card);
            const elapsed = ((Date.now() - start) / 1000).toFixed(2);
            addResult(card, result.status, result.message, elapsed);
        } catch (error) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(2);
            addResult(card, 'RECUSADA', 'Erro: ' + error.message, elapsed);
        }
        
        updateProgress();
        
        if (!stopRequested && i < cards.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    
    document.getElementById('btnStart').style.display = 'block';
    document.getElementById('btnStop').style.display = 'none';
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = false;
    document.getElementById('btnStop').innerText = '⏹️ PARAR';
    document.getElementById('status-bar').style.display = 'none';
    
    if (!stopRequested) {
        document.getElementById('statusText').innerText = `Finalizado! ✅ LIVE: ${liveCount} | ❌ DEAD: ${deadCount}`;
    }
    
    isRunning = false;
    stopRequested = false;
}

function stopCheck() {
    stopRequested = true;
    document.getElementById('btnStop').disabled = true;
    document.getElementById('btnStop').innerText = '⏹️ PARANDO...';
    document.getElementById('statusText').innerText = 'Parando após este cartão...';
}
</script>
</body>
</html>