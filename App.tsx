import React, { useState, useMemo, useRef } from 'react';
import { ImageState, ClothingOption } from './types.ts';
import { CLOTHING_OPTIONS, FILTER_OPTIONS, APP_TITLE } from './constants.ts';
import { GlossyButton } from './components/GlossyButton.tsx';
import { editImageWithGemini } from './services/geminiService.ts';

const App: React.FC = () => {
  const [state, setState] = useState<ImageState>({
    original: null,
    edited: null,
    isProcessing: false,
    error: null,
  });
  const [showDresses, setShowDresses] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showProMenu, setShowProMenu] = useState(false);
  const [clothingTab, setClothingTab] = useState<'male' | 'female'>('male');
  const [proEditPrompt, setProEditPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClothing = useMemo(() => {
    return CLOTHING_OPTIONS.filter(opt => opt.gender === clothingTab);
  }, [clothingTab]);

  const optimizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64); return; }

        // Optimize resolution for Gemini to handle faster
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setState(prev => ({ ...prev, error: "File size too large. Please upload under 10MB." }));
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        setIsOptimizing(true);
        try {
          const optimizedResult = await optimizeImage(rawResult);
          setState({
            original: optimizedResult,
            edited: optimizedResult,
            isProcessing: false,
            error: null
          });
        } catch (err) {
          setState(prev => ({ ...prev, error: "Image processing failed." }));
        } finally {
          setIsOptimizing(false);
          setShowDresses(false);
          setShowFilters(false);
          setShowProMenu(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setState({ original: null, edited: null, isProcessing: false, error: null });
    setShowDresses(false);
    setShowFilters(false);
    setShowProMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processEdit = async (prompt: string) => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await editImageWithGemini(state.edited || state.original, prompt);
      setState(prev => ({ ...prev, edited: result, isProcessing: false, error: null }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "AI editing failed. Please try again." 
      }));
    }
  };

  const handleBgRemove = () => processEdit("Remove the background and make it solid professional studio white. Keep the subject high definition.");
  
  const handleApplyClothing = (optionOrPrompt: ClothingOption | string) => {
    const promptText = typeof optionOrPrompt === 'string' ? optionOrPrompt : optionOrPrompt.prompt;
    processEdit(`DO NOT CHANGE THE PERSON'S FACE OR IDENTITY. Change the current clothing to ${promptText}. The new clothing should fit perfectly.`);
  };

  const handleApplyFilter = (filterPrompt: string) => processEdit(filterPrompt);
  const handlePhotoEnhance = () => processEdit("Professional photo enhancement: improve lighting, sharpen details, and upscale to 4K quality.");
  const handleAIPassport = () => processEdit("Professional Passport Photo: Change background to light blue, change clothes to a formal suit, and center the face.");

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = `rafee-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto overflow-x-hidden">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-[#0a0a0a]/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#007BFF] to-indigo-400 bg-clip-text text-transparent tracking-tighter uppercase">
            {APP_TITLE}
          </h1>
          <p className="text-gray-500 text-[9px] font-black tracking-[0.5em] uppercase opacity-40 mt-1">AI Stylist & Editor Pro</p>
        </div>
        
        <div className="flex items-center gap-3">
          {state.original && (
            <button onClick={handleReset} className="bg-zinc-900/50 hover:bg-zinc-800 text-white/50 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.1em] uppercase transition-all border border-white/5">
              <i className="fa-solid fa-rotate-left"></i> Reselect
            </button>
          )}
          <button onClick={() => { setShowProMenu(!showProMenu); setShowDresses(false); setShowFilters(false); }} className={`px-8 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all duration-300 shadow-xl ${showProMenu ? 'bg-blue-600 text-white' : 'bg-[#007BFF] text-white'}`}>
             <i className="fa-solid fa-crown mr-2"></i> AI PRO
          </button>
        </div>
      </header>

      {state.error && (
        <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-4 text-red-500 animate-pulse">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i>
          <p className="text-xs font-bold uppercase tracking-widest">{state.error}</p>
          <button onClick={() => setState(p => ({...p, error: null}))} className="ml-auto text-white/50 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="w-full space-y-8">
        {showProMenu && (
          <div className="w-full bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[40px] border border-blue-500/20 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handlePhotoEnhance} className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-[#007BFF] transition-all border border-white/5 disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-bolt-lightning text-3xl mb-3"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Enhance HD</span>
              </button>
              <button onClick={handleAIPassport} className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-indigo-600 transition-all border border-white/5 disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-id-card text-3xl mb-3"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Passport AI</span>
              </button>
            </div>
            <div className="bg-zinc-950/40 p-5 rounded-3xl border border-white/5 flex flex-col gap-3">
              <textarea placeholder="Custom instruction (e.g. 'Add a red hat')..." className="flex-1 bg-transparent border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none resize-none" value={proEditPrompt} onChange={(e) => setProEditPrompt(e.target.value)} />
              <button onClick={() => handleApplyClothing(proEditPrompt)} className="bg-blue-600 py-3 rounded-xl text-[10px] uppercase font-black disabled:opacity-50" disabled={state.isProcessing || !proEditPrompt}>Execute Command</button>
            </div>
          </div>
        )}

        {!state.original && (
          <div className="relative preview-box p-24 rounded-[48px] border-dashed border-2 border-[#007BFF]/30 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-md">
            <input type="file" ref={fileInputRef} id="photo-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center group">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 group-hover:bg-blue-600 transition-all">
                <i className="fa-solid fa-upload text-blue-500 group-hover:text-white text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">আপনার ফটো আপলোড করুন</h2>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Neural Vision Technology</p>
            </label>
          </div>
        )}

        {state.original && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlossyButton onClick={handleBgRemove} isLoading={state.isProcessing}>Remove BG</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowDresses(!showDresses); setShowFilters(false); setShowProMenu(false); }}>Outfits</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowFilters(!showFilters); setShowDresses(false); setShowProMenu(false); }}>Filters</GlossyButton>
            </div>

            {showDresses && (
              <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/10">
                <div className="flex justify-center gap-3 mb-8 bg-zinc-950/60 p-1.5 rounded-[20px] w-fit mx-auto">
                  <button onClick={() => setClothingTab('male')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] ${clothingTab === 'male' ? 'bg-[#007BFF]' : 'text-gray-500'}`}>MALE</button>
                  <button onClick={() => setClothingTab('female')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] ${clothingTab === 'female' ? 'bg-pink-600' : 'text-gray-500'}`}>FEMALE</button>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {filteredClothing.map((option) => (
                    <div key={option.id} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => handleApplyClothing(option)}>
                      <div className="w-[85px] h-[85px] rounded-full overflow-hidden border-[3px] border-[#007BFF] group-hover:scale-110 transition-all">
                        <img src={option.thumbnail} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFilters && (
              <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/10 flex flex-wrap gap-6 justify-center">
                {FILTER_OPTIONS.map((filter) => (
                  <button key={filter.id} onClick={() => handleApplyFilter(filter.prompt)} className="flex flex-col items-center gap-3 p-6 rounded-[32px] bg-zinc-950/60 border border-white/5 hover:border-[#007BFF] transition-all group min-w-[120px]">
                    <i className={`fa-solid ${filter.icon} text-2xl text-blue-500 group-hover:text-white`}></i>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{filter.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-12 border-t border-white/5 w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Preview Result</h3>
                {state.edited && (
                  <button onClick={handleExport} className="text-[#007BFF] font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2">
                    <i className="fa-solid fa-download"></i> Download Full Res
                  </button>
                )}
              </div>
              <div className="preview-box rounded-[40px] p-4 min-h-[500px] flex items-center justify-center bg-black border-2 border-[#007BFF]/40 relative">
                {(state.isProcessing || isOptimizing) ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Neural Synthesis Active...</p>
                  </div>
                ) : (
                  <img src={state.edited || ''} className="max-w-full max-h-[75vh] rounded-[24px] shadow-2xl" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="mt-20 py-10 opacity-30 text-[10px] font-black tracking-widest uppercase">&copy; {APP_TITLE}</footer>
    </div>
  );
};

export default App;