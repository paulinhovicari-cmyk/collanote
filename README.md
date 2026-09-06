# CollaNote ✨

App de notas que **lê sua escrita à mão e reescreve numa fonte manuscrita bonita**.

Você escreve no quadro (mouse, dedo ou caneta/Apple Pencil), clica em **"Embelezar minha letra"**, e o CollaNote reconhece o texto e o reexibe numa fonte caligráfica elegante — com opção de trocar a fonte e copiar o resultado.

## ✨ Recursos da v1
- Quadro de escrita à mão com **suavização de traço** (curvas Catmull-Rom) — a própria escrita já fica mais bonita.
- **Reconhecimento de escrita** usando a *Handwriting Recognition API* nativa do navegador (offline, gratuita e privada).
- Reescrita do texto em **5 fontes manuscritas** (Caveat, Dancing Script, Patrick Hand, Shadows Into Light, Kalam).
- Sugestões alternativas de leitura, cópia do texto, cores e espessuras de caneta.

## 🌐 Compatibilidade
O reconhecimento nativo funciona no **Chrome (desktop e Android)**. Em navegadores sem a API
(ex.: Safari/iOS), o quadro continua funcionando, mas o botão de embelezar avisa que o
reconhecimento não está disponível. A camada `src/lib/recognizer.js` foi desenhada para,
no futuro, plugar um motor de nuvem (ex.: Google Vision) sem alterar a interface.

## 🛠️ Stack
- React 19 + Vite
- Canvas HTML5 com Pointer Events
- Handwriting Recognition API (nativa do navegador)

## 🚀 Como rodar
```bash
npm install
npm run dev
```
Abra o endereço mostrado no terminal (por padrão `http://localhost:5173`) **no Chrome**.

## 📁 Estrutura
```
src/
  components/HandwritingCanvas.jsx  # quadro de escrita + captura de traços
  lib/recognizer.js                 # camada de reconhecimento (nativo, plugável)
  lib/smoothing.js                  # suavização de traço (Catmull-Rom)
  App.jsx                           # tela principal (escrever → embelezar)
```

## 🗺️ Próximos passos
- Motor de nuvem para funcionar no iOS/Safari.
- Salvar notas (local + sincronização).
- Exportar o resultado como imagem/PDF.
