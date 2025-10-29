
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ImageContent, ImageResult, ImageStyle } from '../types';
import { generateImages } from '../services/geminiService';
import ImageCard from './ImageCard';
import EditImageModal from './EditImageModal';
import { DownloadIcon, SparklesIcon, SpinnerIcon } from './Icons';

const IMAGE_STYLES: ImageStyle[] = ['Photorealistic', 'Cartoon', 'Pencil Sketch', 'Hyper Realistic', 'Anime', 'Digital Art', 'Minimalist'];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [numImages, setNumImages] = useState<number>(1);
  const [style, setStyle] = useState<ImageStyle>('Photorealistic');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageResult | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `Generate ${numImages} image(s) of: "${prompt}" in a ${style.toLowerCase()} style.`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');

    try {
      const base64Images = await generateImages(prompt, numImages, style);
      const imageResults: ImageResult[] = base64Images.map((base64, index) => ({
        id: `img-${Date.now()}-${index}`,
        base64,
      }));

      const imageContent: ImageContent = {
        type: 'image_generation',
        prompt,
        images: imageResults,
      };

      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: imageContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
      const errorMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Error: ${e.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateImage = (id: string, newBase64: string) => {
    setMessages(prevMessages => 
        prevMessages.map(msg => {
            if (typeof msg.content === 'object' && msg.content.type === 'image_generation') {
                const updatedImages = msg.content.images.map(img => 
                    img.id === id ? { ...img, base64: newBase64 } : img
                );
                return { ...msg, content: { ...msg.content, images: updatedImages } };
            }
            return msg;
        })
    );
  };
  
  const handleSaveAll = (images: ImageResult[], prompt: string) => {
    images.forEach(imageResult => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageResult.base64}`;
      const safePrompt = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
      link.download = `gemini-img-${safePrompt}-${imageResult.id.slice(0, 6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-800/50 rounded-lg shadow-xl border border-gray-700">
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.length === 0 && (
            <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-16 h-16 mb-4 text-indigo-500"/>
                <h2 className="text-2xl font-semibold">Welcome to the Image Studio</h2>
                <p className="mt-2">Describe the image you want to create below and let Gemini bring it to life.</p>
            </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl lg:max-w-2xl ${msg.role === 'user' ? 'bg-indigo-600 rounded-lg p-4' : ''}`}>
              {typeof msg.content === 'string' ? (
                 <p className={msg.role === 'system' ? 'text-red-400 italic' : ''}>{msg.content}</p>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-semibold">Generated images for: "{msg.content.prompt}"</p>
                    <button 
                      onClick={() => handleSaveAll(msg.content.images, msg.content.prompt)}
                      className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Save All
                    </button>
                  </div>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(msg.content.images.length, 4)} gap-4`}>
                    {msg.content.images.map(image => (
                      <ImageCard
                        key={image.id}
                        imageResult={image}
                        onEdit={setEditingImage}
                        prompt={msg.content.prompt}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
        <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe an image... e.g., 'A futuristic city skyline at sunset'"
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                rows={2}
                disabled={isLoading}
              />
              <div className="flex md:flex-col gap-4">
                 <div className="flex-1">
                    <label htmlFor="numImages" className="block text-xs font-medium text-gray-400 mb-1">Count</label>
                    <select id="numImages" value={numImages} onChange={e => setNumImages(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500">
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="style" className="block text-xs font-medium text-gray-400 mb-1">Style</label>
                    <select id="style" value={style} onChange={e => setStyle(e.target.value as ImageStyle)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500">
                      {IMAGE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>
            </div>
          
            <button type="submit" disabled={isLoading || !prompt.trim()} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin"/>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
        </form>
      </div>
      {editingImage && (
        <EditImageModal
          imageResult={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleUpdateImage}
        />
      )}
    </div>
  );
};

export default ChatInterface;
