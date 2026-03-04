
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Zap, Download, SquareArrowUp } from 'lucide-react';
import { AppTheme } from '../types';
import { kidApi } from '../services/api';

interface ImageEditorProps {
  theme: AppTheme;
  kidCode: string;
}

const STYLE_PRESETS = [
  { 
    id: 'roblox', 
    label: 'Роблокс', 
    icon: '🤖', 
    color: '#00A2FF',
    prompt: 'Use ONLY the uploaded photo as source. Keep the same person, face, pose and main composition. Apply Roblox style: 3D blocky look, bright colors, plastic textures, chunky geometry. Single image only, no collage, no split panels, no extra characters, no text.' 
  },
  { 
    id: 'ghibli', 
    label: 'Гибли', 
    icon: '🌳', 
    color: '#4CAF50',
    prompt: 'Use ONLY the uploaded photo as source. Keep the same person, face, pose and main composition. Redraw in Studio Ghibli inspired style: soft hand-painted textures, warm cinematic lighting, lush colors. Single image only, no collage, no split panels, no text.' 
  },
  { 
    id: 'anime', 
    label: 'Аниме', 
    icon: '✨', 
    color: '#E91E63',
    prompt: 'Use ONLY the uploaded photo as source. Keep the same person, face, pose and main composition. Convert to modern high-quality anime: clean line art, cinematic light, saturated colors. Single image only, no collage, no split panels, no text.' 
  },
  { 
    id: 'minecraft', 
    label: 'Майнкрафт', 
    icon: '🧱', 
    color: '#795548',
    prompt: 'Use ONLY the uploaded photo as source. Keep the same person, face, pose and main composition. Transform into Minecraft voxel style: blocky cubes, pixel textures, game-like lighting. Single image only, no collage, no split panels, no text.' 
  },
];

const buildStrictMagicPrompt = (prompt: string): string =>
  `Style-transfer request: use ONLY the uploaded source photo as the base image. Preserve the same person identity, face, pose, framing and scene composition. Do not create a new scene. Do not generate collage or split-screen. ${prompt}`;

const MAGIC_LENS_CACHE_VERSION = 1;
const MAGIC_LENS_CACHE_PREFIX = 'fw_magic_lens_cache';

type MagicLensCacheState = {
  v: number;
  image: string | null;
  editedImage: string | null;
  editedShareUrl: string | null;
  prompt: string;
  activePreset: string | null;
};

type MagicLensGenerateOutcome = {
  imageUrl: string | null;
  errorMessage: string | null;
};

const magicLensMemoryCache = new Map<string, MagicLensCacheState>();
const magicLensInFlight = new Map<string, Promise<MagicLensGenerateOutcome>>();

const readMagicLensCache = (cacheKey: string): MagicLensCacheState | null => {
  const memory = magicLensMemoryCache.get(cacheKey);
  if (memory) return memory;
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Partial<MagicLensCacheState>;
    return {
      v: MAGIC_LENS_CACHE_VERSION,
      image: typeof cached?.image === 'string' && cached.image ? cached.image : null,
      editedImage: typeof cached?.editedImage === 'string' && cached.editedImage ? cached.editedImage : null,
      editedShareUrl: typeof (cached as any)?.editedShareUrl === 'string' && (cached as any).editedShareUrl
        ? (cached as any).editedShareUrl
        : null,
      prompt: typeof cached?.prompt === 'string' ? cached.prompt : '',
      activePreset: typeof cached?.activePreset === 'string' && cached.activePreset ? cached.activePreset : null,
    };
  } catch (err) {
    console.warn('[MAGIC LENS] cache read failed:', err);
    return null;
  }
};

const writeMagicLensCache = (cacheKey: string, payload: MagicLensCacheState): void => {
  magicLensMemoryCache.set(cacheKey, payload);
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch (err) {
    console.warn('[MAGIC LENS] cache write failed:', err);
  }
};

const clearMagicLensCache = (cacheKey: string): void => {
  magicLensMemoryCache.delete(cacheKey);
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(cacheKey);
  } catch (err) {
    console.warn('[MAGIC LENS] cache clear failed:', err);
  }
};

const normalizeImageForMagic = async (
  dataUrl: string,
  options: { maxSide?: number; quality?: number } = {},
): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return dataUrl;

  const maxSide = Math.max(320, Math.min(1024, Number(options.maxSide) || 896));
  const qualityRaw = Number(options.quality);
  const quality = Number.isFinite(qualityRaw) ? Math.max(0.45, Math.min(0.92, qualityRaw)) : 0.82;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

const getFileExtByMimeType = (mimeType: string): string => {
  const mime = String(mimeType || '').toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
};

const buildMagicFileName = (ext: string): string =>
  `vey-magic-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(String(value || '').trim());
const isTransportLoadError = (err: unknown): boolean => {
  const message = String((err as any)?.message || err || '').toLowerCase();
  return (
    message.includes('load failed') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout')
  );
};
const TELEGRAM_SHARE_BASE = 'https://t.me/share/url';
const DATA_IMAGE_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

const openTelegramLink = (url: string): void => {
  const tg = (window as any)?.Telegram?.WebApp;
  if (typeof tg?.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

const decodeDataImageUrl = (src: string): Blob | null => {
  const raw = String(src || '').trim();
  const match = raw.match(DATA_IMAGE_URL_RE);
  if (!match) return null;

  try {
    const mimeType = match[1] || 'image/jpeg';
    const base64 = match[2] || '';
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch (err) {
    console.error('[MAGIC LENS] data url decode failed:', err);
    return null;
  }
};

const ImageEditor: React.FC<ImageEditorProps> = ({ theme, kidCode }) => {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editedShareUrl, setEditedShareUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const cacheKey = useMemo(
    () => `${MAGIC_LENS_CACHE_PREFIX}:${kidCode || 'unknown'}`,
    [kidCode],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setIsCacheHydrated(false);
    if (typeof window === 'undefined') {
      setIsCacheHydrated(true);
      return;
    }

    const restored = readMagicLensCache(cacheKey);
    setImage(restored?.image || null);
    setEditedImage(restored?.editedImage || null);
    setEditedShareUrl(restored?.editedShareUrl || null);
    setPrompt(restored?.prompt || '');
    setActivePreset(restored?.activePreset || null);
    setIsCacheHydrated(true);

    const pending = magicLensInFlight.get(cacheKey);
    if (pending) {
      setIsProcessing(true);
      pending.finally(() => {
        if (!isMountedRef.current) return;
        const afterDone = readMagicLensCache(cacheKey);
        setImage(afterDone?.image || null);
        setEditedImage(afterDone?.editedImage || null);
        setEditedShareUrl(afterDone?.editedShareUrl || null);
        setPrompt(afterDone?.prompt || '');
        setActivePreset(afterDone?.activePreset || null);
        setIsProcessing(false);
      });
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!isCacheHydrated || typeof window === 'undefined') return;

      const payload: MagicLensCacheState = {
        v: MAGIC_LENS_CACHE_VERSION,
        image,
        editedImage,
        editedShareUrl,
        prompt,
        activePreset,
      };

    const hasContent = Boolean(
        String(image || '').trim() ||
        String(editedImage || '').trim() ||
        String(editedShareUrl || '').trim() ||
        String(prompt || '').trim() ||
        String(activePreset || '').trim(),
      );

    if (!hasContent) {
      clearMagicLensCache(cacheKey);
      return;
    }

    writeMagicLensCache(cacheKey, payload);
  }, [isCacheHydrated, cacheKey, image, editedImage, editedShareUrl, prompt, activePreset]);

  const getBlobFromSource = async (src: string): Promise<Blob> => {
    const localDataBlob = decodeDataImageUrl(src);
    if (localDataBlob) return localDataBlob;

    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Не удалось получить картинку (HTTP ${response.status})`);
    }
    return response.blob();
  };

  const handleDownloadEdited = async () => {
    const downloadSource = (editedShareUrl && isHttpUrl(editedShareUrl)) ? editedShareUrl : editedImage;
    if (!downloadSource || isDownloading) return;

    setIsDownloading(true);
    try {
      if (isHttpUrl(downloadSource)) {
        const link = document.createElement('a');
        link.href = downloadSource;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = buildMagicFileName('jpg');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const blob = await getBlobFromSource(downloadSource);
      const ext = getFileExtByMimeType(blob.type);
      const fileName = buildMagicFileName(ext);
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
    } catch (err) {
      console.error('[MAGIC LENS] download failed:', err);
      if (isHttpUrl(downloadSource)) {
        openTelegramLink(downloadSource);
      } else {
        alert('Не удалось скачать картинку. Попробуй еще раз.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareToTelegram = async () => {
    if (!editedImage || isSharing) return;

    setIsSharing(true);
    try {
      const shareSource = (editedShareUrl && isHttpUrl(editedShareUrl)) ? editedShareUrl : editedImage;

      if (isHttpUrl(shareSource)) {
        const tgUrl = `${TELEGRAM_SHARE_BASE}?url=${encodeURIComponent(shareSource)}`;
        openTelegramLink(tgUrl);
        return;
      }

      const blob = await getBlobFromSource(editedImage);
      const ext = getFileExtByMimeType(blob.type);
      const file = new File([blob], buildMagicFileName(ext), { type: blob.type || 'image/jpeg' });
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      if (nav?.share) {
        const canShareFiles = typeof nav.canShare === 'function'
          ? nav.canShare({ files: [file] })
          : true;

        if (canShareFiles) {
          await nav.share({
            title: 'ВЭЙ Магия',
            files: [file],
          });
          return;
        }
      }

      alert('На этом устройстве нельзя сразу отправить файл в Telegram. Скачай картинку и отправь вручную.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[MAGIC LENS] share failed:', err);
        alert('Не удалось поделиться картинкой. Попробуй еще раз.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawImage = event.target?.result as string;
        const preparedImage = await normalizeImageForMagic(rawImage);
        setImage(preparedImage);
        setEditedImage(null);
        setEditedShareUrl(null);
        setPrompt('');
        setActivePreset(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async (customPrompt?: string, presetId?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!image || !finalPrompt) return;

    const worldForRequest = presetId || activePreset;
    if (!worldForRequest) {
      alert('Сначала выбери игровой мир!');
      return;
    }
    
    setIsProcessing(true);
    if (presetId) setActivePreset(presetId);

    const pendingCache: MagicLensCacheState = {
      v: MAGIC_LENS_CACHE_VERSION,
      image,
      editedImage: null,
      editedShareUrl: null,
      prompt: finalPrompt,
      activePreset: worldForRequest,
    };
    writeMagicLensCache(cacheKey, pendingCache);

    const job = (async (): Promise<MagicLensGenerateOutcome> => {
      try {
        let sourceImage = image;
        const callGenerate = (photoPayload: string) =>
          kidApi.generateMagicImage(kidCode, {
            world: worldForRequest,
            photo: photoPayload,
            prompt: buildStrictMagicPrompt(finalPrompt),
          });

        let result: Awaited<ReturnType<typeof callGenerate>> | null = null;
        const variants: Array<{ maxSide: number; quality: number }> = [
          { maxSide: 896, quality: 0.82 },
          { maxSide: 640, quality: 0.72 },
          { maxSide: 512, quality: 0.65 },
        ];

        let lastError: unknown = null;
        for (let index = 0; index < variants.length; index += 1) {
          const variant = variants[index];
          if (index > 0 && sourceImage.startsWith('data:image/')) {
            const compactImage = await normalizeImageForMagic(sourceImage, variant);
            if (compactImage && compactImage !== sourceImage) {
              sourceImage = compactImage;
              if (isMountedRef.current) setImage(compactImage);
            }
          }

          try {
            result = await callGenerate(sourceImage);
            lastError = null;
            break;
          } catch (attemptErr) {
            lastError = attemptErr;
            const canRetry =
              isTransportLoadError(attemptErr) &&
              sourceImage.startsWith('data:image/') &&
              index < variants.length - 1;
            if (!canRetry) break;
            await new Promise((resolve) => setTimeout(resolve, 350 * (index + 1)));
          }
        }

        if (!result) throw lastError || new Error('magic_generate_failed');

        if (result?.image_url) {
          const resolvedShareUrl = isHttpUrl(String((result as any)?.share_url || ''))
            ? String((result as any).share_url)
            : isHttpUrl(result.image_url)
            ? result.image_url
            : null;
          writeMagicLensCache(cacheKey, {
            v: MAGIC_LENS_CACHE_VERSION,
            image: sourceImage,
            editedImage: result.image_url,
            editedShareUrl: resolvedShareUrl,
            prompt: finalPrompt,
            activePreset: null,
          });
          return { imageUrl: result.image_url, errorMessage: null };
        }

        return {
          imageUrl: null,
          errorMessage: result?.message || "Магия временно устала! Попробуй еще раз через минуту.",
        };
      } catch (err: any) {
        console.error('[MAGIC LENS] generate error:', err);
        return {
          imageUrl: null,
          errorMessage: err?.message || 'Неизвестная ошибка',
        };
      }
    })();

    magicLensInFlight.set(cacheKey, job);
    const outcome = await job.finally(() => {
      if (magicLensInFlight.get(cacheKey) === job) {
        magicLensInFlight.delete(cacheKey);
      }
    });

    if (!isMountedRef.current) return;

    setIsProcessing(false);
    setActivePreset(null);

    if (outcome.imageUrl) {
      setEditedImage(outcome.imageUrl);
      const restored = readMagicLensCache(cacheKey);
      setEditedShareUrl(restored?.editedShareUrl || null);
      return;
    }

    alert(`Ошибка магии: ${outcome.errorMessage || 'Неизвестная ошибка'}`);
  };

  const reset = () => {
    setImage(null);
    setEditedImage(null);
    setEditedShareUrl(null);
    setPrompt('');
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col pt-5 sm:pt-8 pb-28 sm:pb-32 px-4 sm:px-6 md:px-7 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[38px] sm:text-4xl font-black italic uppercase leading-tight" style={{ color: '#FFFFFF' }}>
          Студия
        </h1>
        <p className="opacity-40 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] mt-2">Преврати фото в приключение!</p>
      </div>

      {!image ? (
        <div 
          className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 p-6 sm:p-12 rounded-[28px] sm:rounded-[48px] border-[3px] sm:border-4 border-dashed transition-all duration-500"
          style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: theme.surface }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse" />
            <div className="relative p-7 sm:p-10 rounded-full bg-white/5 border-2 border-white/5 shadow-inner">
              <Camera size={52} className="sm:hidden opacity-20" />
              <Camera size={64} className="hidden sm:block opacity-20" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-black uppercase text-lg sm:text-xl italic">Загрузи реальность</h3>
            <p className="text-[9px] sm:text-[10px] opacity-40 font-bold uppercase">Мы добавим в неё немного магии</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glossy-btn w-full py-4 sm:py-6 rounded-[20px] sm:rounded-[24px] font-black uppercase text-[12px] sm:text-sm flex items-center justify-center space-x-2.5 sm:space-x-3 shadow-2xl transition-all active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <Upload size={20} />
            <span>Выбрать фото</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500">
          {/* Main Display */}
          <div className="relative group rounded-[28px] sm:rounded-[40px] overflow-hidden border-[4px] sm:border-[6px] transition-all duration-700" 
               style={{ 
                 borderColor: isProcessing ? theme.secondary : theme.accent,
                 boxShadow: isProcessing ? `0 0 80px ${theme.secondary}88` : `0 20px 60px ${theme.shadow}`
               }}>
            <img 
              src={editedImage || image} 
              alt="Preview" 
              className="w-full aspect-square object-cover" 
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 sm:p-8 z-10 animate-in fade-in duration-300">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-white/20 blur-3xl animate-pulse rounded-full" />
                  <RefreshCw size={68} className="sm:hidden animate-spin text-white opacity-80" />
                  <RefreshCw size={80} className="hidden sm:block animate-spin text-white opacity-80" />
                  <Sparkles size={32} className="sm:hidden absolute -top-3 -right-3 animate-bounce" style={{ color: theme.accent }} />
                  <Sparkles size={40} className="hidden sm:block absolute -top-4 -right-4 animate-bounce" style={{ color: theme.accent }} />
                </div>
                <h4 className="font-black uppercase tracking-[0.24em] sm:tracking-[0.3em] text-xl sm:text-2xl mb-4" style={{ color: theme.accent }}>Колдуем...</h4>
                <div className="flex space-x-2">
                   {[0, 1, 2].map(i => (
                     <div key={i} className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                   ))}
                </div>
              </div>
            )}
            
            {editedImage && !isProcessing && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col gap-2 animate-in zoom-in-50">
                <button
                  onClick={handleDownloadEdited}
                  disabled={isDownloading}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isDownloading ? 'opacity-60' : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{
                    borderColor: 'rgba(255,255,255,0.35)',
                    backgroundColor: 'rgba(12,18,30,0.82)',
                    color: '#FFFFFF',
                  }}
                  title="Скачать на устройство"
                  aria-label="Скачать на устройство"
                >
                  <Download size={18} />
                </button>

                <button
                  onClick={handleShareToTelegram}
                  disabled={isSharing}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSharing ? 'opacity-60' : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{
                    borderColor: 'rgba(255,255,255,0.9)',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    color: '#121212',
                  }}
                  title="Поделиться в Telegram"
                  aria-label="Поделиться в Telegram"
                >
                  <SquareArrowUp size={18} />
                </button>
              </div>
            )}
          </div>

          {/* STYLE PRESETS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 ml-2">
               <Zap size={15} className="text-yellow-400" />
               <h3 className="text-[10px] sm:text-[11px] font-black uppercase opacity-60 tracking-[0.2em]">Выбери игровой мир:</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    disabled={isProcessing}
                    onClick={() => {
                      setPrompt(preset.prompt);
                      handleEdit(preset.prompt, preset.id);
                    }}
                    className={`relative p-4 sm:p-6 rounded-[22px] sm:rounded-[32px] border-[3px] sm:border-4 transition-all duration-300 flex flex-col items-center justify-center space-y-2.5 sm:space-y-3 overflow-hidden group ${
                      isProcessing && !isSelected ? 'opacity-30 grayscale pointer-events-none' : 'hover:scale-[1.05] active:scale-95'
                    } ${isSelected ? 'animate-pulse-slow' : ''}`}
                    style={{ 
                      backgroundColor: theme.surface,
                      borderColor: isSelected ? preset.color : 'rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? `0 0 40px ${preset.color}66` : 'none'
                    }}
                  >
                    <div 
                      className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-3xl opacity-20"
                      style={{ backgroundColor: preset.color }}
                    />
                    
                    <span className={`text-4xl sm:text-5xl transition-all duration-500 ${isSelected ? 'scale-125 rotate-12' : 'group-hover:scale-110'}`}>
                      {preset.icon}
                    </span>
                    <span className="text-[12px] sm:text-[14px] font-black uppercase tracking-tight" style={{ color: isSelected ? preset.color : theme.text }}>
                      {preset.label}
                    </span>

                    {isSelected && isProcessing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                         <RefreshCw className="animate-spin" style={{ color: preset.color }} size={24} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-2 sm:pt-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={reset}
                disabled={isProcessing}
                className="flex-1 py-4 sm:py-6 rounded-[20px] sm:rounded-[28px] font-black uppercase text-[11px] sm:text-xs bg-white/5 hover:bg-white/10 transition-all border-2 border-white/5 opacity-50 hover:opacity-100"
              >
                Очистить
              </button>
              <button 
                onClick={() => handleEdit()}
                disabled={!prompt || isProcessing}
                className={`flex-[2] glossy-btn py-4 sm:py-6 rounded-[20px] sm:rounded-[28px] font-black uppercase text-[12px] sm:text-sm flex items-center justify-center space-x-2.5 sm:space-x-3 shadow-2xl transition-all ${
                  (!prompt || isProcessing) ? 'opacity-30' : 'hover:scale-[1.02] active:scale-95'
                }`}
                style={{ 
                  backgroundColor: theme.accent, 
                  color: theme.bg,
                }}
              >
                <Zap size={18} />
                <span>Запуск Магии</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.03); filter: brightness(1.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ImageEditor;
