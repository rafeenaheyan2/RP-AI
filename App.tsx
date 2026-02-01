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

        const MAX_DIM = 1024; // Balanced resolution for Gemini performance
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
      if (file.size > 15 * 1024 * 1024) {
        setState(prev => ({ ...prev, error: "Image is too large. Max 15MB allowed." }));
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
          setShowDresses(false);
          setShowFilters(false);
          setShowProMenu(false);
        } catch (err) {
          setState(prev => ({ ...prev, error: "Image optimization failed." }));
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
      const currentBase = state.original; // Always use original to avoid quality degradation
      const result = await editImageWithGemini(currentBase, prompt);
      setState(prev => ({ ...prev, edited: result, isProcessing: false, error: null }));
    } catch (err: any) {
      console.error("Editing Error:", err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "Something went wrong. Please check your internet connection." 
      }));
    }
  };

  const handleBgRemove = () => processEdit("Remove the current background completely. Replace it with a solid, professional, neutral studio grey-white background. Do not modify the person's face or body.");
  
  const handleApplyClothing = (optionOrPrompt: ClothingOption | string) => {
    const promptText = typeof optionOrPrompt === 'string' ? optionOrPrompt : optionOrPrompt.prompt;
    processEdit(`MAINTAIN THE PERSON'S FACE, POSE, AND IDENTITY. Replace their current clothes with: ${promptText}. The new clothing must look photorealistic and fit the person's body perfectly.`);
  };

  const handleApplyFilter = (filterPrompt: string) => processEdit(filterPrompt);
  
  const handlePhotoEnhance = () => processEdit("Professional photo enhancement: fix lighting, improve color balance, sharpen features, and upscale details while maintaining a natural skin texture.");
  
  const handleAIPassport = () => processEdit("Convert to a professional passport photo: Solid light blue background, change clothes to a formal dark suit with white shirt, and ensure face is vertically centered and clear.");

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = `rafee-ai-pro-edit.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto overflow-x-hidden">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-[#0a0a0a]/90 backdrop-blur-3xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#007BFF] to-blue-400 bg-clip-text text-transparent tracking-tighter uppercase">
            {APP_TITLE}
          </h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.6em] uppercase opacity-50 mt-1">Professional Neural Editor</p>
        </div>
        
        <div className="flex items-center gap-3">
          {state.original && (
            <button 
              onClick={() => { setState({ original: null, edited: null, isProcessing: false, error: null }); if(fileInputRef.current) fileInputRef.current.value = ''; }}
              className="bg-zinc-900/80 hover:bg-zinc-800 text-white/60 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all border border-white/5"
            >
              <i className="fa-solid fa-camera-rotate mr-2"></i> Reset
            </button>
          )}
          <button 
            onClick={() => { setShowProMenu(!showProMenu); setShowDresses(false); setShowFilters(false); }} 
            className={`px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all duration-300 shadow-xl ${showProMenu ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-[#007BFF] text-white hover:bg-blue-600'}`}
          >
             <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> PRO TOOLS
          </button>
        </div>
      </header>

      {state.error && (
        <div className="w-full mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-[28px] flex flex-col gap-3 text-red-500 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            <span className="font-black text-xs uppercase tracking-[0.2em]">Processing Error</span>
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-auto opacity-50 hover:opacity-100 transition-opacity"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <p className="text-[12px] font-semibold leading-relaxed">{state.error}</p>
          <div className="h-[1px] bg-red-500/20 w-full my-1"></div>
          <p className="text-[9px] opacity-60 uppercase tracking-widest">Tip: Ensure your image has a clear face and good lighting.</p>
        </div>
      )}

      <div className="w-full space-y-8">
        {showProMenu && (
          <div className="w-full bg-zinc-900/60 backdrop-blur-2xl p-8 rounded-[40px] border border-blue-500/30 shadow-3xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-6 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handlePhotoEnhance} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-zinc-950/80 hover:bg-[#007BFF] transition-all border border-white/10 hover:border-blue-400 group disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-sparkles text-3xl mb-4 text-blue-400 group-hover:text-white transition-colors"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Enhance HD</span>
              </button>
              <button onClick={handleAIPassport} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-zinc-950/80 hover:bg-indigo-600 transition-all border border-white/10 hover:border-indigo-400 group disabled:opacity-50" disabled={state.isProcessing}>
                <i className="fa-solid fa-passport text-3xl mb-4 text-indigo-400 group-hover:text-white transition-colors"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Passport AI</span>
              </button>
            </div>
            <div className="bg-zinc-950/60 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
              <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Custom AI Command</h4>
              <textarea 
                placeholder="E.g. 'Add a gold watch and black sunglasses'..." 
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-gray-700 focus:border-blue-500 outline-none resize-none transition-colors" 
                value={proEditPrompt} 
                onChange={(e) => setProEditPrompt(e.target.value)} 
              />
              <button 
                onClick={() => handleApplyClothing(proEditPrompt)} 
                className="bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20" 
                disabled={state.isProcessing || !proEditPrompt}
              >
                Execute AI Magic
              </button>
            </div>
          </div>
        )}

        {!state.original ? (
          <div className="relative preview-box p-24 rounded-[60px] border-dashed border-2 border-blue-500/20 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-xl hover:bg-zinc-900/60 hover:border-blue-500/50 transition-all duration-700 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} id="photo-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
            <div className="w-28 h-28 bg-blue-600/5 rounded-full flex items-center justify-center mb-10 border border-blue-500/10 group-hover:scale-110 group-hover:bg-blue-600 group-hover:shadow-2xl group-hover:shadow-blue-600/40 transition-all duration-500">
              <i className="fa-solid fa-cloud-arrow-up text-blue-500 group-hover:text-white text-4xl"></i>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase text-center">শুরু করতে ফটো আপলোড করুন</h2>
            <p className="text-gray-600 text-[11px] font-bold uppercase tracking-[0.4em] text-center">Secure Neural Image Cloud</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <GlossyButton onClick={handleBgRemove} isLoading={state.isProcessing} className="py-5 shadow-2xl">Remove Background</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowDresses(!showDresses); setShowFilters(false); setShowProMenu(false); }} className="py-5">Change Outfit</GlossyButton>
              <GlossyButton variant="secondary" onClick={() => { setShowFilters(!showFilters); setShowDresses(false); setShowProMenu(false); }} className="py-5">Photo Filters</GlossyButton>
            </div>

            {showDresses && (
              <div className="bg-zinc-900/40 p-10 rounded-[50px] border border-white/5 animate-in slide-in-from-bottom-8 duration-700 shadow-3xl">
                <div className="flex justify-center gap-4 mb-10 bg-black/60 p-2 rounded-3xl w-fit mx-auto border border-white/10">
                  <button onClick={() => setClothingTab('male')} className={`px-12 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all ${clothingTab === 'male' ? 'bg-[#007BFF] text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}>MALE</button>
                  <button onClick={() => setClothingTab('female')} className={`px-12 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all ${clothingTab === 'female' ? 'bg-pink-600 text-white shadow-xl shadow-pink-600/20' : 'text-gray-500 hover:text-white'}`}>FEMALE</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                  {filteredClothing.map((option) => (
                    <div key={option.id} className="flex flex-col items-center gap-4 group cursor-pointer" onClick={() => handleApplyClothing(option)}>
                      <div className="w-[100px] h-[100px] rounded-[32px] overflow-hidden border-2 border-transparent group-hover:border-blue-500 group-hover:scale-110 transition-all duration-500 shadow-2xl bg-black">
                        <img src={option.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 group-hover:text-blue-400 uppercase tracking-widest text-center">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFilters && (
              <div className="bg-zinc-900/40 p-10 rounded-[50px] border border-white/5 flex flex-wrap gap-6 justify-center animate-in slide-in-from-bottom-8 duration-700 shadow-3xl">
                {FILTER_OPTIONS.map((filter) => (
                  <button key={filter.id} onClick={() => handleApplyFilter(filter.prompt)} className="flex flex-col items-center gap-4 p-8 rounded-[40px] bg-black/40 border border-white/5 hover:border-blue-500 transition-all group min-w-[140px] hover:bg-zinc-950">
                    <i className={`fa-solid ${filter.icon} text-3xl text-blue-500 group-hover:text-white group-hover:rotate-12 transition-all duration-500`}></i>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{filter.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-16 border-t border-white/5 w-full">
              <div className="flex justify-between items-end mb-8 px-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Live Preview</h3>
                  <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mt-1">High-Precision Neural Output</p>
                </div>
                {state.edited && !state.isProcessing && (
                  <button onClick={handleExport} className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 border border-blue-500/20 shadow-xl">
                    <i className="fa-solid fa-download"></i> Save Final Photo
                  </button>
                )}
              </div>
              <div className="preview-box rounded-[60px] p-6 min-h-[600px] flex items-center justify-center bg-black/80 border-2 border-blue-500/10 relative overflow-hidden shadow-3xl">
                {(state.isProcessing || isOptimizing) ? (
                  <div className="text-center z-10 p-20 bg-black/40 backdrop-blur-md rounded-[40px] border border-white/5">
                    <div className="w-20 h-20 border-[6px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8 shadow-2xl shadow-blue-600/20"></div>
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">Synthesizing Pixels...</p>
                    <p className="text-[9px] text-gray-600 font-bold uppercase mt-4 tracking-widest">Applying Neural Stylist</p>
                  </div>
                ) : (
                  <img src={state.edited || ''} className="max-w-full max-h-[80vh] rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-700" alt="Result" />
                )}
                {/* Background Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#007BFF 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="mt-24 py-12 opacity-30 text-[10px] font-black tracking-[0.6em] uppercase border-t border-white/5 w-full text-center">
        Powered by RAFEE Neural Core &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;