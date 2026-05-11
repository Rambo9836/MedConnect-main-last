import React, { useState, useRef } from 'react';
import { Paperclip, Image, FileText, X, Send } from 'lucide-react';

interface CreatePostProps {
  onSubmit: (content: string, attachments?: File[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  onSubmit, 
  placeholder = "Share your experience, ask a question, or offer support...",
  disabled = false 
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, attachments.length > 0 ? attachments : undefined);
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit}>
        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={disabled || isSubmitting}
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                <div className="text-gray-500">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSubmitting}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" />
              <span>Add Attachment</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost; 