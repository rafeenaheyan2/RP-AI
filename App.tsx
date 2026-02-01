
import React, { useState, useMemo, useRef } from 'react';
import { ImageState, ClothingOption } from './types';
import { CLOTHING_OPTIONS, FILTER_OPTIONS, APP_TITLE } from './constants';
import { GlossyButton } from './components/GlossyButton';
import { editImageWithGemini } from './services/geminiService';

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

  // Helper function to optimize and resize image using Canvas
  const optimizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64); return; }

        const TARGET_WIDTH = 1080;
        const scaleFactor = TARGET_WIDTH / img.width;
        canvas.width = TARGET_WIDTH;
        canvas.height = img.height * scaleFactor;

        // Draw with smoothing (equivalent to high quality resampling)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Simple Sharpening Filter simulation
        ctx.filter = 'contrast(1.1) saturate(1.1) brightness(1.05)';
        ctx.drawImage(canvas, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = base64;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        setIsOptimizing(true);
        
        // Automatic Quality Optimization (Mirroring the Streamlit logic)
        const optimizedResult = await optimizeImage(rawResult);
        
        setState({
          original: optimizedResult,
          edited: optimizedResult,
          isProcessing: false,
          error: null
        });
        
        setIsOptimizing(false);
        setShowDresses(false);
        setShowFilters(false);
        setShowProMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setState({
      original: null,
      edited: null,
      isProcessing: false,
      error: null
    });
    setShowDresses(false);
    setShowFilters(false);
    setShowProMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBgRemove = async () => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const result = await editImageWithGemini(
        state.edited || state.original,
        "Remove the background perfectly. Make the background pure solid studio white. Keep the person high-definition."
      );
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: "Background removal failed." }));
    }
  };

  const handleApplyClothing = async (optionOrPrompt: ClothingOption | string) => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    const promptText = typeof optionOrPrompt === 'string' 
      ? optionOrPrompt 
      : optionOrPrompt.prompt;

    try {
      const result = await editImageWithGemini(
        state.edited || state.original,
        `IDENTITY PROTECTION: DO NOT CHANGE THE FACE. Change clothes to ${promptText}. Fit the new clothes perfectly to the body shape while keeping the head and face exactly as it is.`
      );
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: "Style application failed." }));
    }
  };

  const handleApplyFilter = async (filterPrompt: string) => {
    if (!state.edited && !state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await editImageWithGemini(
        state.edited || state.original,
        `${filterPrompt}. Do not alter the person's identity.`
      );
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: "Filter failed." }));
    }
  };

  const handlePhotoEnhance = async () => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await editImageWithGemini(
        state.edited || state.original,
        "Deep Neural Enhancement: Increase image resolution to 4K quality, sharpen all details, fix skin textures without altering the person's face structure. Improve lighting and colors to a professional level."
      );
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: "AI Enhancement failed." }));
    }
  };

  const handleAIPassport = async () => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await editImageWithGemini(
        state.edited || state.original,
        "IDENTITY PRESERVED PASSPORT PHOTO: Change background to professional light blue. Change attire to a high-quality formal navy suit and white shirt. Align the head straight. Keep facial features 100% original."
      );
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: "Passport photo failed." }));
    }
  };

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = 'ai-stylist-export.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const toast = document.createElement('div');
    toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#007BFF] text-white px-8 py-3 rounded-2xl shadow-2xl z-50 font-black tracking-widest text-xs uppercase animate-bounce";
    toast.innerText = "Saved to Gallery! ✨";
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-[#0a0a0a]/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#007BFF] to-indigo-400 bg-clip-text text-transparent tracking-tighter uppercase">
            {APP_TITLE}
          </h1>
          <p className="text-gray-500 text-[9px] font-black tracking-[0.5em] uppercase opacity-40 mt-1">AI Stylist & Editor Pro</p>
        </div>
        
        <div className="flex items-center gap-3">
          {state.original && (
            <button 
              onClick={handleReset}
              className="bg-zinc-900/50 hover:bg-zinc-800 text-white/50 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.1em] uppercase transition-all border border-white/5 flex items-center gap-2"
            >
              <i className="fa-solid fa-rotate-left"></i> Reselect
            </button>
          )}
          <button 
            onClick={() => { setShowProMenu(!showProMenu); setShowDresses(false); setShowFilters(false); }}
            className={`px-8 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all duration-300 shadow-xl ${showProMenu ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-gradient-to-br from-[#007BFF] to-[#002BFF] text-white hover:shadow-blue-500/40'}`}
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-crown text-xs"></i> AI PRO
            </span>
          </button>
        </div>
      </header>

      <div className="w-full space-y-8">
        {showProMenu && (
          <div className="w-full animate-[slideDown_0.4s_ease-out] bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[40px] border border-blue-500/20 shadow-3xl space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <h3 className="text-blue-400 font-black text-2xl uppercase tracking-tighter">AI Studio Tools</h3>
              <button onClick={() => setShowProMenu(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                <i className="fa-solid fa-xmark text-gray-500"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handlePhotoEnhance}
                  className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-[#007BFF] group transition-all duration-300 border border-white/5"
                  disabled={state.isProcessing}
                >
                  <i className="fa-solid fa-bolt-lightning text-3xl text-blue-500 group-hover:text-white mb-3"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Enhance HD</span>
                </button>
                <button 
                  onClick={handleAIPassport}
                  className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-indigo-600 group transition-all duration-300 border border-white/5"
                  disabled={state.isProcessing}
                >
                  <i className="fa-solid fa-id-card text-3xl text-indigo-500 group-hover:text-white mb-3"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Passport AI</span>
                </button>
              </div>

              <div className="bg-zinc-950/40 p-5 rounded-3xl border border-white/5 flex flex-col gap-3">
                 <textarea 
                    placeholder="Custom instruction... (e.g., 'Make me look professional')" 
                    className="flex-1 bg-transparent border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-blue-500 focus:outline-none transition-all resize-none"
                    value={proEditPrompt}
                    onChange={(e) => setProEditPrompt(e.target.value)}
                  />
                  <button 
                    onClick={() => handleApplyClothing(proEditPrompt)}
                    className="bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 transition-all text-[10px] uppercase tracking-widest"
                    disabled={state.isProcessing || !proEditPrompt}
                  >
                    Execute AI Command
                  </button>
              </div>
            </div>
          </div>
        )}

        {!state.original && (
          <div className="relative group w-full max-w-2xl mx-auto">
            <div className="relative preview-box p-24 rounded-[48px] border-dashed border-2 border-[#007BFF]/30 flex flex-col items-center justify-center transition-all duration-500 hover:border-[#007BFF] bg-zinc-950/50 backdrop-blur-md">
              <input 
                type="file" 
                ref={fileInputRef}
                id="photo-upload" 
                className="hidden" 
                onChange={handleFileUpload}
                accept="image/*"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center group">
                <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <i className="fa-solid fa-upload text-blue-500 group-hover:text-white text-3xl"></i>
                </div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase text-center">আপনার ফটো আপলোড করুন</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] text-center">Neural Vision Technology</p>
              </label>
            </div>
          </div>
        )}

        {state.original && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlossyButton onClick={handleBgRemove} isLoading={state.isProcessing} className="py-5 uppercase text-[11px] tracking-widest">
                <i className="fa-solid fa-wand-magic-sparkles"></i> Remove BG
              </GlossyButton>
              <GlossyButton 
                variant="secondary" 
                onClick={() => { setShowDresses(!showDresses); setShowFilters(false); setShowProMenu(false); }}
                className={`py-5 uppercase text-[11px] tracking-widest ${showDresses ? 'border-[#007BFF] text-blue-400 bg-blue-600/5' : ''}`}
              >
                <i className="fa-solid fa-shirt"></i> Outfits
              </GlossyButton>
              <GlossyButton 
                variant="secondary" 
                onClick={() => { setShowFilters(!showFilters); setShowDresses(false); setShowProMenu(false); }}
                className={`py-5 uppercase text-[11px] tracking-widest ${showFilters ? 'border-[#007BFF] text-blue-400 bg-blue-600/5' : ''}`}
              >
                <i className="fa-solid fa-palette"></i> Filters
              </GlossyButton>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest animate-pulse">
                {state.error}
              </div>
            )}

            {showDresses && (
              <div className="space-y-8 animate-[slideDown_0.3s_ease-out] bg-zinc-900/30 backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 shadow-3xl">
                <div className="flex justify-center gap-3 mb-8 p-1.5 bg-zinc-950/60 rounded-[20px] w-fit mx-auto border border-white/5">
                  <button onClick={() => setClothingTab('male')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] transition-all uppercase tracking-widest ${clothingTab === 'male' ? 'bg-[#007BFF] text-white' : 'text-gray-500 hover:text-white'}`}>MALE</button>
                  <button onClick={() => setClothingTab('female')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] transition-all uppercase tracking-widest ${clothingTab === 'female' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>FEMALE</button>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {filteredClothing.map((option) => (
                    <div key={option.id} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => handleApplyClothing(option)}>
                      <div className="w-[85px] h-[85px] rounded-full overflow-hidden border-[3px] border-[#007BFF] shadow-[0_4px_15px_rgba(0,123,255,0.4)] group-hover:scale-110 group-hover:border-white transition-all duration-300 relative bg-zinc-950">
                        <img src={option.thumbnail} alt={option.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all flex items-center justify-center">
                          <i className="fa-solid fa-check text-white opacity-0 group-hover:opacity-100 text-lg"></i>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest text-center max-w-[90px] truncate">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFilters && (
              <div className="animate-[slideDown_0.3s_ease-out] bg-zinc-900/30 p-10 rounded-[48px] border border-white/10 shadow-3xl">
                <div className="flex flex-wrap gap-6 justify-center">
                  {FILTER_OPTIONS.map((filter) => (
                    <button key={filter.id} onClick={() => handleApplyFilter(filter.prompt)} className="flex flex-col items-center gap-3 p-6 rounded-[32px] bg-zinc-950/60 border border-white/5 hover:border-[#007BFF] hover:bg-zinc-900 transition-all group min-w-[120px]">
                      <div className="w-14 h-14 rounded-full bg-blue-600/5 flex items-center justify-center border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <i className={`fa-solid ${filter.icon} text-blue-500 text-2xl group-hover:text-white`}></i>
                      </div>
                      <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">{filter.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-12 border-t border-white/5 space-y-8 w-full">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
                    <div className="w-1.5 h-8 bg-[#007BFF] rounded-full"></div> Final Preview
                  </h2>
                  <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">High Resolution Enhanced Rendering</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   {state.edited && (
                    <GlossyButton onClick={handleExport} className="flex-1 md:w-auto px-12 py-4 text-[10px] uppercase tracking-widest">
                      <i className="fa-solid fa-download"></i> Export Photo
                    </GlossyButton>
                   )}
                </div>
              </div>

              <div className="preview-box rounded-[40px] p-4 overflow-hidden shadow-2xl min-h-[550px] flex items-center justify-center bg-[#050505] border-2 border-[#007BFF]/40 relative">
                {(state.isProcessing || isOptimizing) ? (
                  <div className="flex flex-col items-center py-20">
                    <div className="relative w-20 h-20 mb-10">
                      <div className="absolute inset-0 border-[4px] border-blue-600/10 rounded-full"></div>
                      <div className="absolute inset-0 border-[4px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <i className="fa-solid fa-microchip absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xl"></i>
                    </div>
                    <div className="space-y-3 text-center">
                      <h4 className="text-blue-500 text-xl font-black uppercase tracking-[0.3em] animate-pulse">
                        {isOptimizing ? "Optimizing Quality" : "Neural Processing"}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.5em]">Refining textures & details...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative group max-w-full">
                    <img src={state.edited || ''} alt="AI Result" className="max-w-full max-h-[75vh] rounded-[24px] object-contain animate-[fadeIn_0.5s_ease-out] shadow-2xl" />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="mt-40 py-20 text-center w-full border-t border-white/5">
        <p className="text-[10px] font-black tracking-[0.6em] uppercase text-gray-600">&copy; {new Date().getFullYear()} {APP_TITLE} • Neural Lab</p>
      </footer>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); filter: blur(4px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8), 0 0 40px rgba(0,123,255,0.05); }
      `}</style>
    </div>
  );
};

export default App;
