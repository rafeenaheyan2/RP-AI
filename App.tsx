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
        resolve(canvas.toDataURL('image/jpeg', 0.85));
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
        try {
          const optimizedResult = await optimizeImage(rawResult);
          setState({
            original: optimizedResult,
            edited: optimizedResult,
            isProcessing: false,
            error: null
          });
        } catch (err) {
          setState(prev => ({ ...prev, error: "Failed to load image." }));
        } finally {
          setIsOptimizing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processEdit = async (prompt: string) => {
    if (!state.original) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const currentImg = state.edited || state.original;
      const result = await editImageWithGemini(currentImg, prompt);
      setState(prev => ({ ...prev, edited: result, isProcessing: false, error: null }));
    } catch (err: any) {
      console.error("App Error:", err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "AI failed to process. Try again." 
      }));
    }
  };

  const handleBgRemove = () => processEdit("Remove the background cleanly and replace it with a professional studio solid white background. Keep the person exactly as they are.");
  
  const handleApplyClothing = (optionOrPrompt: ClothingOption | string) => {
    const promptText = typeof optionOrPrompt === 'string' ? optionOrPrompt : optionOrPrompt.prompt;
    processEdit(`Keep the person's face, hair, and pose exactly the same. Change their clothes to ${promptText}. Ensure the new clothing fits naturally and realistically.`);
  };

  const handleApplyFilter = (filterPrompt: string) => processEdit(filterPrompt);
  const handlePhotoEnhance = () => processEdit("Professional photo enhancement: improve clarity, lighting, color balance, and sharpen details for a 4K look.");
  const handleAIPassport = () => processEdit("Make this a professional passport photo. Set background to solid light blue, change clothes to a formal dark suit with a white shirt, and ensure face is centered.");

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = `rafee-ai-edit.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-[#0a0a0a]/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#007BFF] to-indigo-400 bg-clip-text text-transparent tracking-tighter uppercase">
            {APP_TITLE}
          </h1>
          <p className="text-gray-500 text-[9px] font-black tracking-[0.5em] uppercase opacity-40 mt-1">AI Stylist & Editor Pro</p>
        </div>
        
        <div className="flex items-center gap-3">
          {state.original && (
            <button onClick={() => { setState({ original: null, edited: null, isProcessing: false, error: null }); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="bg-zinc-900/50 hover:bg-zinc-800 text-white/50 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.1em] uppercase transition-all border border-white/5">
              <i className="fa-solid fa-rotate-left"></i> Change Photo
            </button>
          )}
          <button onClick={() => { setShowProMenu(!showProMenu); setShowDresses(false); setShowFilters(false); }} className={`px-8 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all duration-300 shadow-xl ${showProMenu ? 'bg-blue-600 text-white' : 'bg-[#007BFF] text-white'}`}>
             <i className="fa-solid fa-crown mr-2"></i> AI PRO
          </button>
        </div>
      </header>

      {state.error && (
        <div className="w-full mb-8 p-5 bg-red-500/10 border border-red-500/30 rounded-[24px] flex flex-col gap-2 text-red-500">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation text-xl"></i>
            <span className="font-black text-xs uppercase tracking-widest">Error Detected</span>
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-auto opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <p className="text-[11px] font-medium leading-relaxed opacity-80">{state.error}</p>
          <p className="text-[9px] opacity-40 uppercase tracking-tighter mt-2">Check your API settings if this persists</p>
        </div>
      )}

      <div className="w-full space-y-8">
        {showProMenu && (
          <div className="w-full bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[40px] border border-blue-500/20 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handlePhotoEnhance} className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-[#007BFF] transition-all border border-white/5 disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-bolt-lightning text-3xl mb-3 text-yellow-400"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Enhance HD</span>
              </button>
              <button onClick={handleAIPassport} className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950/50 hover:bg-indigo-600 transition-all border border-white/5 disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-id-card text-3xl mb-3 text-blue-400"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Passport AI</span>
              </button>
            </div>
            <div className="bg-zinc-950/40 p-5 rounded-3xl border border-white/5 flex flex-col gap-3">
              <textarea placeholder="Write anything... (e.g. 'Add sunglasses and a black hat')" className="flex-1 bg-transparent border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none resize-none" value={proEditPrompt} onChange={(e) => setProEditPrompt(e.target.value)} />
              <button onClick={() => handleApplyClothing(proEditPrompt)} className="bg-blue-600 py-3 rounded-xl text-[10px] uppercase font-black disabled:opacity-50" disabled={state.isProcessing || !proEditPrompt}>Magic Edit</button>
            </div>
          </div>
        )}

        {!state.original ? (
          <div className="relative preview-box p-24 rounded-[48px] border-dashed border-2 border-[#007BFF]/30 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-md hover:bg-zinc-900 transition-all duration-500 group">
            <input type="file" ref={fileInputRef} id="photo-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                <i className="fa-solid fa-upload text-blue-500 group-hover:text-white text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">আপনার ফটো আপলোড করুন</h2>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">AI Image Processing System</p>
            </label>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlossyButton onClick={handleBgRemove} isLoading={state.isProcessing}>Remove Background</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowDresses(!showDresses); setShowFilters(false); setShowProMenu(false); }}>Change Outfit</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowFilters(!showFilters); setShowDresses(false); setShowProMenu(false); }}>Artistic Filters</GlossyButton>
            </div>

            {showDresses && (
              <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center gap-3 mb-8 bg-zinc-950/60 p-1.5 rounded-[20px] w-fit mx-auto border border-white/5">
                  <button onClick={() => setClothingTab('male')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] transition-all ${clothingTab === 'male' ? 'bg-[#007BFF] text-white' : 'text-gray-500 hover:text-white'}`}>MALE</button>
                  <button onClick={() => setClothingTab('female')} className={`px-10 py-2.5 rounded-[16px] font-black text-[10px] transition-all ${clothingTab === 'female' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>FEMALE</button>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {filteredClothing.map((option) => (
                    <div key={option.id} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => handleApplyClothing(option)}>
                      <div className="w-[85px] h-[85px] rounded-full overflow-hidden border-[3px] border-transparent group-hover:border-[#007BFF] transition-all group-hover:scale-110 shadow-lg">
                        <img src={option.thumbnail} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFilters && (
              <div className="bg-zinc-900/30 p-10 rounded-[48px] border border-white/10 flex flex-wrap gap-6 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                {FILTER_OPTIONS.map((filter) => (
                  <button key={filter.id} onClick={() => handleApplyFilter(filter.prompt)} className="flex flex-col items-center gap-3 p-6 rounded-[32px] bg-zinc-950/60 border border-white/5 hover:border-[#007BFF] transition-all group min-w-[120px]">
                    <i className={`fa-solid ${filter.icon} text-2xl text-blue-500 group-hover:text-white group-hover:scale-125 transition-all`}></i>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{filter.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-12 border-t border-white/5 w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Live Preview</h3>
                {state.edited && (
                  <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-[#007BFF] px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5 shadow-xl">
                    <i className="fa-solid fa-cloud-arrow-down"></i> Download HD
                  </button>
                )}
              </div>
              <div className="preview-box rounded-[40px] p-4 min-h-[500px] flex items-center justify-center bg-zinc-950 border-2 border-[#007BFF]/40 relative overflow-hidden">
                {(state.isProcessing || isOptimizing) ? (
                  <div className="text-center z-10">
                    <div className="w-16 h-16 border-[6px] border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Processing Image...</p>
                  </div>
                ) : (
                  <img src={state.edited || ''} className="max-w-full max-h-[75vh] rounded-[24px] shadow-2xl animate-in zoom-in-95 duration-500" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="mt-20 py-10 opacity-30 text-[10px] font-black tracking-[0.5em] uppercase border-t border-white/5 w-full text-center">
        Powered by RAFEE Neural Engine &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;