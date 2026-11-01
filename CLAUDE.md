# CLAUDE.md — Ateliê da Ester (aplicativo de desenho)

> As regras gerais estão no `CLAUDE.md` da pasta mãe e no `0 Readme First/HARNESS.md` de lá. Aqui fica
> só o que é deste projeto. Tudo da Ester mora em `ESTER SORIANO/` (ordem do titular, 01/11/2026).

- **O que é:** `Atelie_da_Ester.html` — aplicativo de desenho e pintura num arquivo só (~45 KB, sem internet, sem
  instalação), para a mesa XP-Pen Deco 01 V3 e para tablet (dedo e caneta). Pedido do titular, 01/11/2026.
- **Folha 1200×900 com 3 camadas:** foto de fundo (opcional) · PINTURA · LINHAS (em cima, multiplicar). O balde de
  tinta para nas linhas. Pressão pelos Pointer Events: no Windows, ligar o **Windows Ink** no driver XP-Pen.
- **Começos:** tela em branco · foto → folha de colorir (diferença de gaussianas com alisamento que preserva
  borda, corte pela proporção de pixels e remoção de pedacinhos soltos; calcula sempre em 1200×900) · desenhar
  por cima da foto · teste da caneta · 15 páginas prontas (7 da Bíblia; 8 de ensino infantil, agora na seção
  "Para os pequenos", guardadas para a irmã mais nova) · 4 de **Tabuada secreta** (pixel art: cada quadrado
  tem uma conta sorteada a cada abertura, a legenda dá a cor de cada resultado e o botão **✔ Conferir** lê a
  pintura e marca em vermelho o que falta).
- **Lápis realista (01/11/2026):** foto → "Desenho a lápis realista" (esquiva de cor com alisamento que preserva
  borda; é o padrão do modal da foto) e 7 páginas prontas a lápis feitas de obras e fotos em **domínio público**
  (procedência em `docs/PROCEDENCIA.md`). As referências do titular (obras assinadas) só inspiraram o estilo.
- **Personagem:** o mesmo desenho SVG da Jornada (nenhuma foto da Ester é usada).
- **Guardado só no navegador:** galeria (`atelie-ester:galeria`, até 30 miniaturas). "Salvar" também baixa o PNG.
- **Teste antes de commitar:** `node testes/teste_atelie.mjs .scratch/prints` (13 conferências: páginas, lápis realista, balde,
  pressão, espelho, desfazer, carimbo, foto → folha, salvar, tabuada secreta, tablet deitado e em pé com toque) e
  `node testes/teste_atelie.mjs --autoteste .scratch/auto` (tem de acusar o balde vazando).
- **Uso familiar** — não é funcionalidade do portal, salvo ordem em contrário do titular.
