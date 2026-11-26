
export interface AnalysisResult {
    markdownCount: number;
    symbolCount: number;
    details: {
        headings: number;
        bold: number;
        italic: number;
        links: number;
        lists: number;
        code: number;
    };
}

export function analyzeText(text: string): AnalysisResult {
    // Regex to match characters that are NOT: letters (including accented), numbers, whitespace, or basic punctuation.
    const specialSymbolsRegex = /[^a-zA-Z0-9\s.,;:?!'"`\-áéíóúâêîôûàãõçÁÉÍÓÚÂÊÎÔÛÀÃÕÇ]/g;

    const analysis: AnalysisResult = {
        markdownCount: 0,
        symbolCount: (text.match(specialSymbolsRegex) || []).length,
        details: {
            headings: (text.match(/^#+\s/gm) || []).length,
            bold: (text.match(/\*\*(.*?)\*\*|__(.*?)__/g) || []).length,
            italic: (text.match(/\*(.*?)\*|_(.*?)_/g) || []).length,
            links: (text.match(/\[(.*?)\]\((.*?)\)/g) || []).length,
            lists: (text.match(/^(\s*(\*|-|\+)\s|(\d+\.)\s)/gm) || []).length,
            code: (text.match(/`([^`]+)`/g) || []).length,
        },
    };

    analysis.markdownCount = Object.values(analysis.details).reduce((sum, count) => sum + count, 0);

    return analysis;
}

export function cleanText(text: string, options: { removeMarkdown: boolean; removeSymbols: boolean }): string {
    let cleaned = text;

    if (options.removeMarkdown) {
        // Remove headers but keep text
        cleaned = cleaned.replace(/^#+\s/gm, '');
        // Remove bold/italic but keep text
        cleaned = cleaned.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '$1$2');
        cleaned = cleaned.replace(/\*(.*?)\*|_(.*?)_/g, '$1$2');
        // Remove links but keep text
        cleaned = cleaned.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
        // Remove list bullets
        cleaned = cleaned.replace(/^(\s*(\*|-|\+)\s|(\d+\.)\s)/gm, '');
        // Remove inline code ticks
        cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
        // Remove blockquotes
        cleaned = cleaned.replace(/^>\s?/gm, '');
    }

    if (options.removeSymbols) {
        const specialSymbolsRegex = /[^a-zA-Z0-9\s.,;:?!'"`\-áéíóúâêîôûàãõçÁÉÍÓÚÂÊÎÔÛÀÃÕÇ]/g;
        cleaned = cleaned.replace(specialSymbolsRegex, '');
    }
    
    return cleaned;
}
