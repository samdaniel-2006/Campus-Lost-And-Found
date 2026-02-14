import React from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isOwner, onResolve, onDelete, onViewDetails }) => {
  const isLost = post.type === 'LOST';

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col h-full group">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <i className={`fas ${isLost ? 'fa-search' : 'fa-gift'} text-4xl mb-2 opacity-50`}></i>
            <span className="text-sm">No image available</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
            isLost ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {post.type}
          </span>
        </div>
        {post.status === 'RESOLVED' && (
           <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
             <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow-lg transform -rotate-12 border-2 border-green-500">
               RESOLVED
             </span>
           </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold text-secondary mb-1 block">{post.category}</span>
            <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{post.title}</h3>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
          {post.description}
        </p>

        <div className="space-y-2 text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt w-4 text-center text-red-400"></i>
            <span className="truncate">{post.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="far fa-calendar-alt w-4 text-center text-blue-400"></i>
            <span>{new Date(post.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
             <i className="fas fa-user w-4 text-center text-gray-400"></i>
             <span className="truncate">Posted by {post.creatorName}</span>
          </div>
        </div>
        
        {/* Contact Info - Visible to all users per request, but styled distinctly */}
        <div className="border-t border-gray-100 pt-3 mt-auto">
             <div className="mb-2">
                 <p className="text-xs text-gray-400 uppercase font-semibold">Contact:</p>
                 <div className="flex flex-col gap-1 mt-1">
                     <a href={`mailto:${post.contactEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                        <i className="fas fa-envelope w-4"></i> {post.contactEmail}
                     </a>
                     {post.contactPhone && (
                        <a href={`tel:${post.contactPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                            <i className="fas fa-phone w-4"></i> {post.contactPhone}
                        </a>
                     )}
                 </div>
             </div>

            {isOwner && post.status !== 'RESOLVED' && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button 
                        onClick={() => onResolve && onResolve(post.id)}
                        className="flex-1 text-xs bg-green-50 text-green-700 py-2 rounded border border-green-200 hover:bg-green-100 font-semibold"
                    >
                        Mark Resolved
                    </button>
                    <button 
                        onClick={() => onDelete && onDelete(post.id)}
                        className="flex-1 text-xs bg-red-50 text-red-700 py-2 rounded border border-red-200 hover:bg-red-100 font-semibold"
                    >
                        Delete
                    </button>
                </div>
            )}
            <button
              onClick={onViewDetails}
              className="mt-3 w-full text-xs bg-blue-50 text-blue-700 py-2 rounded border border-blue-200 hover:bg-blue-100 font-semibold"
            >
              View Details
            </button>
        </div>
      </div>
    </div>
  );
};