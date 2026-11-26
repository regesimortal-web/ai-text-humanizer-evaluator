import React, { useState, useCallback, useEffect, useRef } from 'react';
import { humanizeText, detectAIText, AIDetectionResult } from './services/geminiService';
import { HUMANIZATION_MODES, HUMANIZATION_CONTEXTS } from './constants';
import { analyzeText, AnalysisResult, cleanText } from './utils';
import { Toaster, toast } from 'react-hot-toast';
import { Sun, Moon, Upload, Copy, Download, Trash2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
    // State Management
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [mode, setMode] = useState<string>(Object.keys(HUMANIZATION_MODES)[1]); // Default to Balanceado
    const [context, setContext] = useState<string>(Object.keys(HUMANIZATION_CONTEXTS)[1]); // Default to Blog
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [aiScoreBefore, setAiScoreBefore] = useState<AIDetectionResult | null>(null);
    const [aiScoreAfter, setAiScoreAfter] = useState<AIDetectionResult | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    const [options, setOptions] = useState({
        removeMarkdown: false,
        removeSymbols: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Theme effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);
    
    // Text analysis effect
    useEffect(() => {
        setAnalysisResult(analyzeText(inputText));
    }, [inputText]);

    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setOptions(prev => ({ ...prev, [name]: checked }));
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleHumanize = useCallback(async () => {
        if (!inputText.trim()) {
            toast.error("Please enter some text to humanize.");
            return;
        }
        setIsLoading(true);
        setOutputText('');
        setAiScoreBefore(null);
        setAiScoreAfter(null);
        toast.loading('Humanizing text...', { id: 'humanize' });

        try {
            // Step 1: Detect AI score on original text
            const beforeResult = await detectAIText(inputText);
            setAiScoreBefore(beforeResult);

            // Step 2: Clean text if options are selected
            const textToHumanize = cleanText(inputText, options);

            // Step 3: Humanize the text
            const humanizedResult = await humanizeText(textToHumanize, mode, context);
            setOutputText(humanizedResult);

            // Step 4: Detect AI score on humanized text
            const afterResult = await detectAIText(humanizedResult);
            setAiScoreAfter(afterResult);
            
            toast.success('Humanization successful!', { id: 'humanize' });
        } catch (error) {
            console.error(error);
            toast.error('An error occurred during humanization.', { id: 'humanize' });
        } finally {
            setIsLoading(false);
        }
    }, [inputText, mode, context, options]);
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === 'text/plain' || file.name.endsWith('.md')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setInputText(e.target?.result as string);
                    toast.success('File loaded successfully!');
                };
                reader.readAsText(file);
            } else {
                toast.error('Please upload a .txt or .md file.');
            }
        }
        // Reset file input to allow uploading the same file again
        if(event.target) event.target.value = '';
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    
    const copyToClipboard = (text: string, type: string) => {
        if (!text) {
            toast.error(`There is no ${type} text to copy.`);
            return;
        }
        navigator.clipboard.writeText(text);
        toast.success(`${type} text copied to clipboard!`);
    };

    const downloadText = () => {
        if (!outputText) {
             toast.error("There is no humanized text to download.");
            return;
        }
        const blob = new Blob([outputText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'humanized_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download started!');
    };
    
    const downloadPdf = () => {
        if (!outputText) {
            toast.error("There is no humanized text to download as PDF.");
            return;
        }
        const doc = new jsPDF();
        
        // Configuration
        const margin = 15;
        const lineHeight = 7; // Adjust this value for line spacing
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const maxWidth = pageWidth - margin * 2;
        const textLines = doc.splitTextToSize(outputText, maxWidth);

        let cursorY = margin;

        textLines.forEach((line: string) => {
            // Check if adding the next line would exceed the page height
            if (cursorY + lineHeight > pageHeight - margin) {
                doc.addPage();       // Add a new page
                cursorY = margin;    // Reset Y position to the top margin
            }
            doc.text(line, margin, cursorY);
            cursorY += lineHeight; // Move cursor down for the next line
        });
        
        doc.save("humanized_text.pdf");
        toast.success('PDF download started!');
    };

    const handleClearInput = () => {
        setInputText('');
        setOutputText('');
        setAiScoreBefore(null);
        setAiScoreAfter(null);
        toast('Input cleared!', { icon: '🗑️' });
    };

    const handleClearOutput = () => {
        setOutputText('');
        setAiScoreAfter(null);
        toast('Output cleared!', { icon: '🗑️' });
    };

    const getProbabilityColor = (prob: number | undefined) => {
        if (prob === undefined) return 'text-gray-500';
        if (prob > 70) return 'text-red-500';
        if (prob > 40) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{
                className: 'dark:bg-gray-700 dark:text-white',
            }} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                            Humanizador de Texto IA
                        </h1>
                        <div className="flex items-center gap-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.md" className="hidden" />
                            <button onClick={triggerFileUpload} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Upload File">
                                <Upload className="w-6 h-6" />
                            </button>
                            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle Theme">
                                {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input & Stats */}
                        <div className="flex flex-col gap-6">
                           <div className="relative">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Cole seu texto gerado por IA aqui..."
                                    className="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                                    disabled={isLoading}
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button onClick={() => copyToClipboard(inputText, 'Original')} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Copy input text">
                                      <Copy className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleClearInput} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Clear input text">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Stats Panel */}
                            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4 text-center">Estatísticas</h3>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Probabilidade IA (Antes)</p>
                                        <p className={`text-2xl font-bold ${getProbabilityColor(aiScoreBefore?.probability)}`}>
                                            {aiScoreBefore ? `${aiScoreBefore.probability}%` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Probabilidade IA (Depois)</p>
                                        <p className={`text-2xl font-bold ${getProbabilityColor(aiScoreAfter?.probability)}`}>
                                            {aiScoreAfter ? `${aiScoreAfter.probability}%` : 'N/A'}
                                        </p>
                                    </div>
                                     <div className="p-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Markdown</p>
                                        <p className="text-2xl font-bold">{analysisResult?.markdownCount ?? 0}</p>
                                    </div>
                                     <div className="p-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Símbolos Especiais</p>
                                        <p className="text-2xl font-bold">{analysisResult?.symbolCount ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Output */}
                        <div className="flex flex-col gap-6">
                            {/* Controls */}
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="mode" className="block text-sm font-medium mb-1">Modo:</label>
                                        <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                                            {Object.entries(HUMANIZATION_MODES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="context" className="block text-sm font-medium mb-1">Contexto:</label>
                                        <select id="context" value={context} onChange={(e) => setContext(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                                            {Object.entries(HUMANIZATION_CONTEXTS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 mb-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="removeMarkdown" checked={options.removeMarkdown} onChange={handleOptionChange} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                                        <span>Remover Markdown</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="removeSymbols" checked={options.removeSymbols} onChange={handleOptionChange} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                                        <span>Remover Símbolos</span>
                                    </label>
                                </div>
                                <button onClick={handleHumanize} disabled={isLoading || !inputText.trim()} className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
                                    {isLoading ? 'Humanizando...' : 'Humanizar Texto'}
                                </button>
                            </div>
                            
                            {/* Output */}
                           <div className="relative">
                                <textarea
                                    value={isLoading ? 'Aguarde, a mágica está acontecendo...' : outputText}
                                    readOnly
                                    placeholder="Seu texto humanizado aparecerá aqui..."
                                    className="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 outline-none resize-none"
                                />
                               <div className="absolute top-3 right-3 flex gap-2">
                                  <button onClick={() => copyToClipboard(outputText, 'Humanized')} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Copy output text">
                                    <Copy className="w-5 h-5" />
                                  </button>
                                  <button onClick={downloadText} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Download text">
                                    <Download className="w-5 h-5" />
                                  </button>
                                  <button onClick={downloadPdf} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Download PDF">
                                    <FileText className="w-5 h-5" />
                                  </button>
                                   <button onClick={handleClearOutput} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Clear output text">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;