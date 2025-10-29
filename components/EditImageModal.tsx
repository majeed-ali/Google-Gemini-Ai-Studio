
import React, { useState } from 'react';
import { ImageResult } from '../types';
import { CloseIcon, SparklesIcon, SpinnerIcon } from './Icons';
import { editImage } from '../services/geminiService';

interface EditImageModalProps {
  imageResult: ImageResult;
  onClose: () => void;
  onSave: (id: string, newBase64: string) => void;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ imageResult, onClose, onSave }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyEdit = async () => {
    if (!editPrompt.trim()) {
      setError("Please enter an edit instruction.");
      return;
    }
    setIsEditing(true);
    setError(null);
    try {
      const newBase64 = await editImage(imageResult.base64, 'image/png', editPrompt);
      onSave(imageResult.id, newBase64);
      onClose();
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsEditing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
          <div className="relative aspect-square rounded-md overflow-hidden bg-gray-900">
             <img src={`data:image/png;base64,${imageResult.base64}`} alt="Image to edit" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
                <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Edit Instruction
                </label>
                <textarea
                    id="editPrompt"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., 'Add a retro filter' or 'Make the background blurry'"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    rows={4}
                    disabled={isEditing}
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
        <div className="p-4 border-t border-gray-700">
            <button
                onClick={handleApplyEdit}
                disabled={isEditing || !editPrompt.trim()}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isEditing ? (
                    <>
                        <SpinnerIcon className="w-5 h-5 animate-spin"/>
                        Applying Edit...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Apply Edit
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;
