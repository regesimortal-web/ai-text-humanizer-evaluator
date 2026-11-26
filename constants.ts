export const HUMANIZATION_MODES = {
  rapido: "Rápido",
  balanceado: "Balanceado",
  agressivo: "Agressivo",
};

export const HUMANIZATION_CONTEXTS = {
  academico: "Acadêmico",
  blog: "Blog/Artigo",
  profissional: "Profissional/Negócios",
  criativo: "Criativo",
  social: "Redes Sociais",
};

export const getHumanizePrompt = (mode: string, context: string): string => {
  let modeInstruction = "";
  switch (mode) {
    case "rapido":
      modeInstruction = "Faça mudanças sutis, focando em melhorar a fluidez e corrigir as frases mais robóticas. Mantenha a fidelidade ao texto original como prioridade máxima.";
      break;
    case "balanceado":
      modeInstruction = "Busque um equilíbrio entre naturalidade e fidelidade. Reestruture frases, substitua vocabulário formal por termos mais comuns e melhore o tom geral. O texto deve soar significativamente mais humano.";
      break;
    case "agressivo":
      modeInstruction = "Realize uma reescrita profunda. A prioridade é a máxima humanização, mesmo que isso signifique se afastar da estrutura original. Use criatividade, adicione pequenas imperfeições e uma voz forte. O resultado deve ser indistinguível de um texto escrito por um humano expressivo.";
      break;
  }

  let contextInstruction = "";
  switch (context) {
    case "academico":
      contextInstruction = "Adapte o texto para um contexto acadêmico. Mantenha a formalidade e a precisão técnica, mas melhore a clareza, o fluxo argumentativo e a legibilidade. Evite jargões desnecessários e torne as ideias complexas mais acessíveis.";
      break;
    case "blog":
      contextInstruction = "Transforme o texto em um post de blog conversacional e envolvente. Use uma linguagem mais direta, faça perguntas ao leitor, use contrações e um tom pessoal.";
      break;
    case "profissional":
      contextInstruction = "Reescreva o texto para um ambiente de negócios. Seja claro, conciso e objetivo. Foque em transmitir a mensagem de forma profissional e eficiente, eliminando ambiguidades.";
      break;
    case "criativo":
      contextInstruction = "Injete expressividade e um tom narrativo. Use metáforas, varie o ritmo e crie uma experiência de leitura mais emotiva e imersiva.";
      break;
    case "social":
      contextInstruction = "Adapte o texto para redes sociais. Seja casual, direto e use uma linguagem que gere engajamento. Frases curtas, emojis (quando apropriado) e um tom energético são bem-vindos.";
      break;
  }

  return `Você é um especialista em reescrita e humanização de textos. Seu objetivo é transformar o texto gerado por IA em um conteúdo natural, fluido e autêntico que pareça escrito por um humano real.

**Diretrizes Gerais:**
- **Varie o comprimento e a estrutura das frases:** Alterne entre frases curtas e longas para criar ritmo.
- **Use linguagem natural:** Substitua termos excessivamente formais ou robóticos (como "utilizar", "implementar", "facilitar") por alternativas mais comuns ("usar", "fazer", "ajudar").
- **Adicione imperfeições sutis:** Incorpore contrações ("não", "está") e variações que tornem o texto menos perfeito e mais humano.
- **Mantenha o significado original:** A essência da mensagem deve ser preservada.
- **Evite padrões previsíveis:** Não comece todas as frases da mesma maneira.
- **Adapte-se ao contexto especificado:** Cada contexto exige um tom e estilo diferentes.

**Sua Tarefa:**
1.  **Analise o texto fornecido.**
2.  **Aplique o modo de humanização e o contexto solicitados.**
3.  **Retorne APENAS o texto reescrito**, sem adicionar introduções, conclusões ou qualquer explicação sobre o que você fez.

**Modo de Humanização:** ${HUMANIZATION_MODES[mode]}
${modeInstruction}

**Contexto:** ${HUMANIZATION_CONTEXTS[context]}
${contextInstruction}

Reescreva o texto a seguir:`;
};

export const AI_DETECTION_PROMPT = `Analise o texto a seguir e determine a probabilidade de ter sido gerado por uma IA. Considere os seguintes indicadores: falta de variação no comprimento das sentenças, uso excessivo de vocabulário formal, ausência de contrações, tom consistentemente neutro, transições muito perfeitas e falta de idiossincrasias humanas.

Responda APENAS com um objeto JSON válido, sem nenhum texto ou formatação adicional. O objeto deve ter a seguinte estrutura:
{
  "probability": <um número de 0 a 100 representando a probabilidade percentual de ser IA>,
  "indicators": [
    { "name": "Variação de Frases", "level": "low|medium|high", "description": "Breve descrição do porquê." },
    { "name": "Vocabulário Formal", "level": "low|medium|high", "description": "Breve descrição do porquê." },
    { "name": "Naturalidade (Contrações)", "level": "low|medium|high", "description": "Breve descrição do porquê." }
  ]
}
`;
