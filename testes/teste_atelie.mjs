// Teste do "Ateliê da Ester" no Chrome headless: computador (caneta com pressão) e tablet (toque, deitado e em pé).
// Uso: node testes/teste_atelie.mjs [pasta]   → sai 0 só se tudo passar
//      node testes/teste_atelie.mjs --autoteste → estraga o balde (deixa vazar) e sai 0 só se o teste ACUSAR
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2), AUTO = args.includes('--autoteste');
const OUT = resolve(args.find(a => !a.startsWith('--')) || '.scratch/prints'); mkdirSync(OUT, { recursive: true });
let APP = resolve('Atelie_da_Ester.html');
if (AUTO) { const s = readFileSync(APP, 'utf8'), sab = s.replace('if(lin[i0+3]>90)return;', '').replace('const igual=i=>lin[i+3]<=90&&', 'const igual=i=>'); if (sab === s) { console.log('AUTOTESTE: não plantou'); process.exit(1); } APP = join(OUT, 'atelie-sabotado.html'); writeFileSync(APP, sab); }
const BAIX = join(OUT, 'downloads'); rmSync(BAIX, { recursive: true, force: true }); mkdirSync(BAIX, { recursive: true });
const porta = 9395;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, '--window-size=1440,900', `--user-data-dir=${join(tmpdir(), 'atelie-' + Date.now())}`, 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let alvo; for (let i = 0; i < 40 && !alvo; i++) { await espera(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { } }
if (!alvo) { console.log('FALHA: Chrome não respondeu'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const erros = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const avalia = async e => { const r = await cdp('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return { erro: r.result.exceptionDetails.exception?.description }; return r.result.result.value; };
const print = async n => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n), Buffer.from(r.result.data, 'base64')); };
await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: BAIX });
await cdp('Page.navigate', { url: pathToFileURL(APP).href }); await espera(1500);
const res = []; const confere = (n, ok, d = '') => { res.push(!!ok); console.log(`${ok ? 'OK   ' : 'FALHA'} ${n}${d ? ' · ' + d : ''}`); };
// ponto da folha (1200×900) → ponto da tela
const tela = async (x, y) => avalia(`(()=>{const r=document.getElementById('folha').getBoundingClientRect();return {x:r.left+${x}*r.width/1200,y:r.top+${y}*r.height/900}})()`);
const pintados = (x0, y0, x1, y1) => avalia(`(()=>{const d=atelieAPI.camadas.cP.getImageData(${x0},${y0},${x1 - x0},${y1 - y0}).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n})()`);
const traco = async (pts, tipo = 'pen', forca = .5) => { const p0 = await tela(...pts[0]); await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p0.x, y: p0.y, button: 'left', buttons: 1, clickCount: 1, pointerType: tipo, force: forca });
  for (const p of pts.slice(1)) { const q = await tela(...p); await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: q.x, y: q.y, button: 'left', buttons: 1, pointerType: tipo, force: forca }); }
  const pf = await tela(...pts.at(-1)); await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pf.x, y: pf.y, button: 'left', buttons: 0, clickCount: 1, pointerType: tipo }); };
const linhaH = (y, x0, x1) => Array.from({ length: 30 }, (_, k) => [x0 + (x1 - x0) * k / 29, y]);

// T1 · as 15 páginas prontas aparecem com imagem
await espera(500);
const t1 = await avalia("({n:document.querySelectorAll('[data-pag]').length,ok:[...document.querySelectorAll('[data-pag] img')].filter(i=>i.complete&&i.naturalWidth>0).length})");
confere('T1 · 52 páginas prontas (mar, animais, pessoas, clássicos, infantil, Bíblia) com miniatura', t1.n === 52 && t1.ok === 52, JSON.stringify(t1));
await print('A-1-inicio.png');
// T2 · abrir "Formas": as linhas vão para a camada de cima
await avalia("document.querySelector('[data-pag=\"formas\"]').click()"); await espera(800);
const t2 = await avalia("(()=>{const d=atelieAPI.camadas.cL.getImageData(0,0,1200,900).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>90)n++;return n})()");
confere('T2 · página "Formas" abre com as linhas na camada de cima', t2 > 5000, `${t2} pixels de linha`);
// T3 · balde dentro do círculo pinta só o círculo (as linhas seguram a tinta)
await avalia("atelieAPI.setCor('#3b6fd8');atelieAPI.balde(210,280)");
const dentro = await pintados(150, 220, 270, 340), fora = await pintados(0, 0, 60, 60), quad = await pintados(500, 200, 680, 380);
confere('T3 · balde pinta dentro do círculo e para na linha', dentro > 12000 && fora === 0 && quad === 0, JSON.stringify({ dentro, fora, quad }));
if (AUTO) { const a = res.some(x => !x); console.log(a ? 'AUTOTESTE OK: o vazamento plantado foi acusado' : 'AUTOTESTE FALHOU'); ws.close(); chrome.kill(); process.exit(a ? 0 : 1); }
await print('A-2-balde-circulo.png');
// T4 · pressão: traço forte é mais grosso que traço fraco
await avalia("atelieAPI.escolher('pincel');atelieAPI.setCor('#e53935')");
await traco(linhaH(560, 600, 1100), 'pen', .1); const fraco = await pintados(590, 520, 1110, 600);
await traco(linhaH(700, 600, 1100), 'pen', 1); const forte = await pintados(590, 650, 1110, 750);
confere('T4 · caneta com pressão: traço forte mais grosso que o fraco', forte > fraco * 2 && fraco > 0, JSON.stringify({ fraco, forte }));
// T5 · espelho desenha dos dois lados
await avalia("document.getElementById('espelho').checked=true"); await traco([[80, 860], [180, 880]], 'pen', .6);
const esq = await pintados(60, 840, 200, 900), dir = await pintados(1000, 840, 1140, 900);
confere('T5 · espelho 🦋 desenha também do outro lado', esq > 0 && dir > 0 && Math.abs(esq - dir) < esq * .3, JSON.stringify({ esq, dir }));
await avalia("document.getElementById('espelho').checked=false");
// T6 · desfazer tira o último traço
await avalia("document.getElementById('bDesfazer').click()"); const depois = await pintados(1000, 840, 1140, 900);
confere('T6 · desfazer tira o último traço', depois === 0, `${depois}`);
// T7 · carimbo
await avalia("atelieAPI.carimbar(1000,200)"); confere('T7 · carimbo aparece na folha', (await pintados(940, 140, 1060, 260)) > 500);
await print('A-3-pintando.png');
// T8 · foto → folha: uma "foto" de círculo vira contorno
const t8 = await avalia(`(()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,800,600);x.fillStyle='#c33';x.beginPath();x.arc(400,300,180,0,7);x.fill();
 const img=new Image();return new Promise(ok=>{img.onload=()=>{const d=atelieAPI.contornos(img,1200,900,14).data;let borda=0,miolo=0;const a=(x,y)=>d[(y*1200+x)*4+3];
  for(let k=0;k<360;k++){const t=k*Math.PI/180;for(let r=262;r<=278;r++){if(a(Math.round(600+r*Math.cos(t)),Math.round(450+r*Math.sin(t)))){borda++;break}}}
  for(let y=400;y<500;y++)for(let x=550;x<650;x++)if(a(x,y))miolo++;ok({borda,miolo})};img.src=c.toDataURL()})})()`);
confere('T8 · foto → folha: o contorno sai na borda, não no meio', t8.borda > 300 && t8.miolo === 0, JSON.stringify(t8));
// T9 · salvar: vai para a galeria e baixa o PNG
await avalia("document.getElementById('bSalvar').click()");
// o download leva um tempo variável: espera o arquivo aparecer (até 15 s), não um prazo fixo
let arq = []; for (let k = 0; k < 30 && !arq.length; k++) { await espera(500); arq = readdirSync(BAIX).filter(f => /^Ester_formas_.*\.png$/.test(f)); } const gal = await avalia('atelieAPI.galeria().length');
confere('T9 · salvar guarda na galeria e baixa o PNG', arq.length === 1 && gal === 1, JSON.stringify({ arq, gal }));
await avalia("document.getElementById('bTerminei').click()"); await espera(400); await print('A-4-terminei.png'); await avalia("document.getElementById('bContinuar').click()");
// T13 · desenho realista a lápis: abre com o sombreado na camada de linhas; e a foto vira lápis
await avalia("atelieAPI.ir('tInicio')"); await espera(200);
await avalia("document.querySelector('[data-pag=\"perola\"]').click()"); await espera(900);
const t13a = await avalia("(()=>{const d=atelieAPI.camadas.cL.getImageData(0,0,1200,900).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>60)n++;return n})()");
const t13b = await avalia(`(()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');x.fillStyle='#eee';x.fillRect(0,0,800,600);x.fillStyle='#333';x.beginPath();x.arc(400,300,150,0,7);x.fill();
 const img=new Image();return new Promise(ok=>{img.onload=()=>{const d=atelieAPI.lapis(img,1200,900,20).data;let borda=0,fundo=0;for(let k=0;k<360;k+=4){const t=k*Math.PI/180,px=Math.round(600+220*Math.cos(t)),py=Math.round(450+220*Math.sin(t));if(d[(py*1200+px)*4+3]>40)borda++}for(let y=20;y<80;y++)for(let xx=200;xx<300;xx++)if(d[(y*1200+xx)*4+3]>40)fundo++;ok({borda,fundo})};img.src=c.toDataURL()})})()`);
confere('T13 · desenho a lápis: página realista abre sombreada e a foto vira lápis (borda escura, fundo limpo)', t13a > 20000 && t13b.borda > 60 && t13b.fundo === 0, JSON.stringify({ linhas: t13a, ...t13b }));
await print('A-7-lapis.png');
// T14 · desenho em pé (4:5) encaixa sem esticar: as faixas laterais da folha ficam vazias
await avalia("atelieAPI.ir('tInicio')"); await espera(200);
await avalia("document.querySelector('[data-pag=\"leao\"]').click()"); await espera(900);
const t14 = await avalia("(()=>{const d=atelieAPI.camadas.cL.getImageData(0,0,1200,900).data;let lado=0,meio=0;for(let y=0;y<900;y+=3)for(let x=0;x<1200;x+=3){const a=d[(y*1200+x)*4+3];if(a>40){if(x<230||x>970)lado++;else meio++}}return {lado,meio}})()");
confere('T14 · desenho em pé (leão) encaixa sem distorcer', t14.lado === 0 && t14.meio > 10000, JSON.stringify(t14));
// T15 · aprenda a desenhar: o guia acende passo a passo, some no fim e não entra no PNG
await avalia("atelieAPI.ir('tInicio')"); await espera(200);
const t15a = await avalia("document.querySelectorAll('[data-licao]').length");
await avalia("document.querySelector('[data-licao=\"l-gato\"]').click()"); await espera(400);
const azul = "(()=>{const d=atelieAPI.camadas.cF.getImageData(0,0,1200,900).data;let az=0,ci=0;for(let i=0;i<d.length;i+=16){if(d[i+3]<100)continue;if(d[i+2]>180&&d[i]<120)az++;else ci++}return {az,ci}})()";
const p1 = await avalia(azul); await avalia("atelieAPI.passoLicao(1)"); const p2 = await avalia(azul);
const txt = await avalia("document.getElementById('missaoTxt').textContent");
for (let k = 0; k < 6; k++) await avalia("atelieAPI.passoLicao(1)");
const fim = await avalia(azul); const bt = await avalia("document.getElementById('bPassoProx').disabled");
confere('T15 · passo a passo: 6 lições; passo 1 azul, passo 2 azul + anterior cinza; no fim o guia some', t15a === 6 && p1.az > 50 && p1.ci === 0 && p2.az > 50 && p2.ci > 50 && /Passo 2 de 6/.test(txt) && fim.az === 0 && fim.ci === 0 && bt === true, JSON.stringify({ t15a, p1, p2, fim, bt }));
await avalia("atelieAPI.ir('tInicio')"); await espera(200); await avalia("document.querySelector('[data-licao=\"l-coruja\"]').click()"); await espera(400); await avalia("atelieAPI.passoLicao(1);atelieAPI.passoLicao(1)");
await print('A-8-passo-a-passo.png');
// T12 · tabuada secreta: legenda sem ambiguidade; tudo pintado certo → Conferir dá 100%; um quadrado com a cor errada é acusado
await avalia("atelieAPI.ir('tInicio')"); await espera(200);
const nTab = await avalia("document.querySelectorAll('[data-tab]').length");
await avalia("document.querySelector('[data-tab=\"tab-casa\"]').click()"); await espera(900);
const t12 = await avalia(`(()=>{const A=atelieAPI,cel=A.atual().cel,cor={};let ambigua=0;for(const c of cel){const r=c.a*c.b;if(cor[r]&&cor[r]!==c.l)ambigua++;cor[r]=c.l}
 const vazio=A.conferir().certos;for(const c of cel){A.setCor(A.CORT[c.l][0]);A.balde(A.TX+c.x*A.TC+12,A.TY+c.y*A.TC+12)}const tudo=A.conferir();
 document.getElementById('bContinuar').click();const c0=cel.find(c=>c.l==='R');A.setCor('#2e9e5b');A.balde(A.TX+c0.x*A.TC+12,A.TY+c0.y*A.TC+12);const um=A.conferir();
 return {total:cel.length,ambigua,vazio,tudo:tudo.certos,umErrado:um.certos,marcas:document.querySelectorAll('#marcas i').length}})()`);
confere('T12 · tabuada secreta: 4 desenhos; Conferir acerta o tudo-certo e acusa o quadrado errado', nTab === 4 && t12.ambigua === 0 && t12.vazio === 0 && t12.tudo === t12.total && t12.umErrado === t12.total - 1 && t12.marcas === 1, JSON.stringify({ nTab, ...t12 }));
await print('A-6-tabuada.png');
// T10 · tablet deitado e em pé, com toque: a folha cabe na tela e o dedo desenha
const tablets = { deitado: [1180, 820], 'em pé': [820, 1180] }; const t10 = {};
for (const [nome, [w, h]] of Object.entries(tablets)) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await avalia("atelieAPI.ir('tInicio')"); await espera(200); await avalia("document.querySelector('[data-pag=\"casa\"]').click()"); await espera(800);
  const r = await avalia("(()=>{const f=document.getElementById('folha').getBoundingClientRect();return {l:f.left,t:f.top,r:f.right,b:f.bottom,vw:innerWidth,vh:innerHeight,rolagem:document.documentElement.scrollWidth>innerWidth}})()");
  const a = await tela(400, 820), b = await tela(800, 820);
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] }); for (let k = 1; k <= 12; k++) await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (b.x - a.x) * k / 12, y: a.y }] }); await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const p = await pintados(380, 790, 820, 850); t10[nome] = { cabe: r.l >= 0 && r.r <= r.vw + 1 && r.t >= 0 && r.b <= r.vh + 1, rolagemLateral: r.rolagem, dedo: p }; await print(`A-5-tablet-${nome.replace(' ', '-')}.png`);
}
confere('T10 · tablet deitado e em pé: a folha cabe na tela e o dedo desenha', Object.values(t10).every(v => v.cabe && !v.rolagemLateral && v.dedo > 0), JSON.stringify(t10));
confere('T11 · zero erro de JavaScript', erros.length === 0, erros.join(' | '));
ws.close(); chrome.kill();
const f = res.filter(x => !x).length; console.log(`\n${res.length - f} de ${res.length} conferências OK`); process.exit(f ? 1 : 0);
