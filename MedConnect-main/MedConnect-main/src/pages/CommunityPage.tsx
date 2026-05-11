import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, MessageCircle, Search, Plus, Lock, Globe, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import CommunityPost from '../components/community/CommunityPost';
import CreatePost from '../components/community/CreatePost';

const CommunityPage: React.FC = () => {
  const { communityId } = useParams();
  const { 
    communities, 
    communityPosts, 
    joinCommunity, 
    leaveCommunity,
    isUserMemberOf,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    fetchCommunityPosts,
    createCommunity
  } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    category: 'Research',
    isPrivate: false,
    tags: '' as string
  });
  const [createError, setCreateError] = useState<string>('');

  const selectedCommunity = communityId 
    ? communities.find((c: any) => c?.id?.toString() === communityId?.toString())
    : null;

  const isMember = selectedCommunity ? isUserMemberOf(selectedCommunity.id?.toString()) : false;
  const communityPostsList = selectedCommunity 
    ? communityPosts.filter(post => post.communityId?.toString() === selectedCommunity.id?.toString())
    : [];

  // Fetch posts when community is selected
  useEffect(() => {
    if (selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.id.toString());
    }
  }, [selectedCommunity, fetchCommunityPosts]);

  const filteredCommunities = communities.filter((community: any) => {
    const matchesSearch =
      (community.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (community.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinCommunity = async (id: string) => {
    setIsJoining(true);
    try {
      await joinCommunity(id);
      // Show success message
    } catch (error) {
      console.error('Failed to join community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async (id: string) => {
    try {
      await leaveCommunity(id);
      // Show success message
    } catch (error) {
      console.error('Failed to leave community:', error);
    }
  };

  const handleCreatePost = async (content: string, attachments?: File[]) => {
    if (!selectedCommunity) return;
    await createPost(selectedCommunity.id, content, attachments);
  };

  const handleUpdatePost = async (postId: string, content: string) => {
    await updatePost(postId, content);
    if (selectedCommunity) {
      await fetchCommunityPosts(selectedCommunity.id.toString());
    }
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
    if (selectedCommunity) {
      await fetchCommunityPosts(selectedCommunity.id.toString());
    }
  };

  const handleLikePost = async (postId: string) => {
    await likePost(postId);
    if (selectedCommunity) {
      await fetchCommunityPosts(selectedCommunity.id.toString());
    }
  };

  const handleUnlikePost = async (postId: string) => {
    await unlikePost(postId);
    if (selectedCommunity) {
      await fetchCommunityPosts(selectedCommunity.id.toString());
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    await addComment(postId, content);
    if (selectedCommunity) {
      await fetchCommunityPosts(selectedCommunity.id.toString());
    }
  };

  const isPostLiked = (post: any) => {
    return post.is_liked || false;
  };

  const handleCommunityInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setCommunityForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCommunity(true);
    setCreateError('');
    try {
      const payload: any = {
        name: communityForm.name.trim(),
        description: communityForm.description.trim(),
        category: communityForm.category,
        is_private: communityForm.isPrivate,
        tags: communityForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      };
      const ok = await createCommunity(payload);
      if (ok) {
        setShowCreateCommunity(false);
        setCommunityForm({ name: '', description: '', category: 'Research', isPrivate: false, tags: '' });
      } else {
        setCreateError('Failed to create community. Please try again.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create community.');
    } finally {
      setCreatingCommunity(false);
    }
  };

  if (selectedCommunity) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{selectedCommunity.name}</h1>
                {selectedCommunity.isPrivate ? (
                  <Lock className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Globe className="h-5 w-5 text-green-600" />
                )}
                {isMember && (
                  <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span>Member</span>
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{selectedCommunity.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {selectedCommunity.memberCount} members
                </span>
                <span>{selectedCommunity.category}</span>
                <span>
                  Last activity: {selectedCommunity.lastActivity ? new Date(selectedCommunity.lastActivity).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              {isMember ? (
                <button
                  onClick={() => handleLeaveCommunity(selectedCommunity.id)}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
                >
                  Leave Community
                </button>
              ) : (
                <button
                  onClick={() => handleJoinCommunity(selectedCommunity.id)}
                  disabled={isJoining}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Join Community</span>
                    </>
                  )}
                </button>
              )}
              <Link
                to="/community"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Communities
              </Link>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(selectedCommunity.tags || []).map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Community Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creation - Only for members */}
            {isMember ? (
              <CreatePost
                onSubmit={handleCreatePost}
                placeholder={`Share with ${selectedCommunity.name}...`}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Join to Participate</h3>
                    <p className="text-yellow-700">
                      You need to join this community to create posts and interact with other members.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinCommunity(selectedCommunity.id)}
                  disabled={isJoining}
                  className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join Community'}
                </button>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-4">
              {communityPostsList.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isMember 
                      ? 'Be the first to share something with the community!' 
                      : 'Join the community to see posts and participate in discussions.'
                    }
                  </p>
                </div>
              ) : (
                communityPostsList.map((post) => (
                  <CommunityPost
                    key={post.id}
                    post={post}
                    onLike={handleLikePost}
                    onUnlike={handleUnlikePost}
                    onComment={handleAddComment}
                    onUpdate={handleUpdatePost}
                    onDelete={handleDeletePost}
                    isLiked={isPostLiked(post)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Rules */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Be respectful and supportive</li>
                <li>• No medical advice - consult professionals</li>
                <li>• Protect privacy - no personal information</li>
                <li>• Stay on topic</li>
                <li>• Report inappropriate content</li>
              </ul>
            </div>

            {/* Moderators */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderators</h3>
              <div className="space-y-3">
                {(selectedCommunity.moderators || []).map((mod: any, index: number) => (
                  <div key={mod} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Moderator {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
              <div className="space-y-3">
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  Treatment Guidelines
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  Support Groups
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  Clinical Trial Database
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  Nutrition Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Communities</h1>
        <p className="text-gray-600 mb-6">
          Connect with others who share similar experiences and conditions
        </p>
        
        {/* Search and Create */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search communities..."
            />
          </div>
          {user?.userType === 'researcher' && (
            <button onClick={() => setShowCreateCommunity(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Community Categories */}
      <div className="mb-8">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {['All', 'Cancer Support', 'Research', 'Treatment', 'Nutrition', 'Mental Health'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap
                ${selectedCategory === category ? 'bg-blue-600 text-white border-blue-600' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-300`
              }
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => {
          const isMember = isUserMemberOf(community.id?.toString());
          return (
            <div key={community.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-gray-900">{community.name}</h3>
                  {community.isPrivate ? (
                    <Lock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Globe className="h-4 w-4 text-green-600" />
                  )}
                  {isMember && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Member
                    </span>
                  )}
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {community.category}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">{community.description ?? ''}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {community.memberCount} members
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(community.tags || []).slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <Link
                  to={`/community/${community.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Community
                </Link>
                {isMember ? (
                  <button
                    onClick={() => handleLeaveCommunity(community.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No communities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or browse all communities.
          </p>
        </div>
      )}
      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create New Community</h3>
              <button onClick={() => setShowCreateCommunity(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={communityForm.name}
                  onChange={handleCommunityInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={communityForm.description}
                  onChange={handleCommunityInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={communityForm.category}
                    onChange={handleCommunityInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Research</option>
                    <option>Cancer Support</option>
                    <option>Treatment</option>
                    <option>Nutrition</option>
                    <option>Mental Health</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <input
                    id="isPrivate"
                    type="checkbox"
                    name="isPrivate"
                    checked={communityForm.isPrivate}
                    onChange={handleCommunityInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700">Private community</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={communityForm.tags}
                  onChange={handleCommunityInputChange}
                  placeholder="e.g. oncology, clinical-trials"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {createError && <div className="text-red-600 text-sm">{createError}</div>}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCommunity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creatingCommunity ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;