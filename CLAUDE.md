# CLAUDE.md — Ateliê da Ester (aplicativo de desenho)

> As regras gerais estão no `CLAUDE.md` da pasta mãe e no `0 Readme First/HARNESS.md` de lá. Aqui fica
> só o que é deste projeto. Tudo da Ester mora em `ESTER SORIANO/` (ordem do titular, 01/11/2026).

- **O que é:** `Atelie_da_Ester.html` — aplicativo de desenho e pintura num arquivo só (~45 KB, sem internet, sem
  instalação), para a mesa XP-Pen Deco 01 V3 e para tablet (dedo e caneta). Pedido do titular, 01/11/2026.
- **Folha 1200×900 com 3 camadas:** foto de fundo (opcional) · PINTURA · LINHAS (em cima, multiplicar). O balde de
  tinta para nas linhas. Pressão pelos Pointer Events: no Windows, ligar o **Windows Ink** no driver XP-Pen.
- **Começos:** tela em branco · foto → folha de colorir (contornos por Sobel, corte pela proporção de pixels) ·
  desenhar por cima da foto · teste da caneta · 15 páginas prontas (8 de ensino infantil, 7 da Bíblia, com
  missão; o texto bíblico é resumo com a referência, as citações literais são curtas).
- **Personagem:** o mesmo desenho SVG da Jornada (nenhuma foto da Ester é usada).
- **Guardado só no navegador:** galeria (`atelie-ester:galeria`, até 30 miniaturas). "Salvar" também baixa o PNG.
- **Teste antes de commitar:** `node testes/teste_atelie.mjs .scratch/prints` (11 conferências: páginas, balde,
  pressão, espelho, desfazer, carimbo, foto → folha, salvar, tablet deitado e em pé com toque) e
  `node testes/teste_atelie.mjs --autoteste .scratch/auto` (tem de acusar o balde vazando).
- **Uso familiar** — não é funcionalidade do portal, salvo ordem em contrário do titular.
