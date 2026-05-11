import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Send, User, Edit, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CommunityPostProps {
  post: {
    id: string;
    authorName: string;
    authorType: 'patient' | 'researcher';
    content: string;
    attachments?: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
    }>;
    likes: string[];
    comments: Array<{
      id: string;
      authorName: string;
      authorType: 'patient' | 'researcher';
      content: string;
      createdAt: string;
    }>;
    createdAt: string;
  };
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onUpdate?: (postId: string, content: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  isLiked: boolean;
}

const CommunityPost: React.FC<CommunityPostProps> = ({
  post,
  onLike,
  onUnlike,
  onComment,
  onUpdate,
  onDelete,
  isLiked
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    if (isLiked) {
      await onUnlike(post.id);
    } else {
      await onLike(post.id);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await onComment(post.id, commentText);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!onUpdate || !editText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(post.id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsSubmitting(true);
      try {
        await onDelete(post.id);
      } catch (error) {
        console.error('Failed to delete post:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isOwnPost = user && post.authorName === (user.fullName || user.username);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getAuthorIcon = (authorType: 'patient' | 'researcher') => {
    return authorType === 'researcher' ? '👨‍⚕️' : '👤';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
            {getAuthorIcon(post.authorType)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center">
              {post.authorName}
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                post.authorType === 'researcher' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {post.authorType === 'researcher' ? 'Researcher' : 'Patient'}
              </span>
            </h4>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isOwnPost && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(post.content);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editText.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
              >
                <Check className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(post.content);
                }}
                disabled={isSubmitting}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        )}
        
        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3 space-y-3">
            {post.attachments.map((attachment) => {
              const isImage = (attachment.type || '').startsWith('image/');
              const isVideo = (attachment.type || '').startsWith('video/');
              if (isImage) {
                return (
                  <div key={attachment.id} className="overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-auto max-h-[480px] object-contain bg-black"
                      loading="lazy"
                    />
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                      <span>{attachment.name}</span>
                      <a href={attachment.url} download={attachment.name} className="text-blue-600 hover:text-blue-800">Download</a>
                    </div>
                  </div>
                );
              }
              if (isVideo) {
                return (
                  <div key={attachment.id} className="overflow-hidden rounded-lg border border-gray-200">
                    <video controls className="w-full max-h-[520px] bg-black">
                      <source src={attachment.url} type={attachment.type} />
                      Your browser does not support the video tag.
                    </video>
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                      <span>{attachment.name}</span>
                      <a href={attachment.url} download={attachment.name} className="text-blue-600 hover:text-blue-800">Download</a>
                    </div>
                  </div>
                );
              }
              // Fallback: documents and others (PDF, DOC, etc.)
              return (
                <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                    📎
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500 truncate">{attachment.type || 'file'}</p>
                  </div>
                  <a
                    href={attachment.url}
                    download={attachment.name}
                    className="ml-3 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                  >
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 py-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md transition-colors ${
            isLiked 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </button>
        
        <button className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
          <Share className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 pt-4">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getAuthorIcon(comment.authorType)}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{comment.authorName}</span>
                      <span className={`px-1 py-0.5 text-xs rounded ${
                        comment.authorType === 'researcher' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {comment.authorType === 'researcher' ? 'Researcher' : 'Patient'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-3">
                    {formatTimeAgo(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPost; 