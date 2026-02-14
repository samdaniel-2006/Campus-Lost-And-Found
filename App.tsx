import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from './services/firebase';
import { uploadImageToImgBB } from './services/imgbb';
import { Post, PostType, CATEGORIES } from './types';
import { PostCard } from './components/PostCard';
import { Button } from './components/Button';
import { Modal } from './components/Modal';

// --- Types ---

interface NewPostForm {
  type: PostType;
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
  imageFile: File | null;
}

const INITIAL_FORM_STATE: NewPostForm = {
  type: 'LOST',
  title: '',
  description: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  category: CATEGORIES[0],
  contactEmail: '',
  contactPhone: '',
  imageFile: null
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | PostType>('ALL');
  const [formState, setFormState] = useState<NewPostForm>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // --- Auth & Data Fetching ---

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setFormState(prev => ({ ...prev, contactEmail: currentUser.email || '' }));
        
        // Store user data in 'users' collection
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            lastLogin: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error storing user data:", error);
        }
      }
    });

    // Real-time listener for posts
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : (data.createdAt || 0)
        };
      }) as Post[];
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  // --- Handlers ---

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormState({ ...formState, imageFile: e.target.files[0] });
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      if (formState.imageFile) {
        imageUrl = await uploadImageToImgBB(formState.imageFile);
      }

      const newPost = {
        type: formState.type,
        title: formState.title,
        description: formState.description,
        location: formState.location,
        date: formState.date,
        category: formState.category,
        contactEmail: formState.contactEmail,
        contactPhone: formState.contactPhone,
        imageUrl: imageUrl,
        createdBy: user.uid,
        creatorName: user.displayName || 'Anonymous',
        creatorPhoto: user.photoURL || '',
        createdAt: Date.now(),
        status: 'OPEN'
      };

      await addDoc(collection(db, "posts"), {
        ...newPost,
        createdAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setFormState({ ...INITIAL_FORM_STATE, contactEmail: user.email || '' });
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolvePost = async (postId: string) => {
    if (!confirm("Are you sure you want to mark this item as resolved/found?")) return;
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { status: 'RESOLVED' });
    } catch (error) {
      console.error("Error resolving post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // --- Filtering ---

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || post.type === filterType;
    return matchesSearch && matchesType;
  });

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navbar */}
      <nav className="bg-primary text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full text-primary">
                 <i className="fas fa-university text-xl"></i>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">CampusConnect</span>
              <span className="font-bold text-xl tracking-tight sm:hidden">CC</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="hidden md:flex items-center gap-2 bg-accent hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
                  >
                    <i className="fas fa-plus"></i> Post Item
                  </button>
                  <div className="flex items-center gap-3 ml-2">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    />
                    <button onClick={handleLogout} className="text-gray-200 hover:text-white text-sm font-medium">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Button variant="secondary" onClick={handleLogin} className="border-none bg-white text-primary hover:bg-gray-100">
                  <i className="fab fa-google"></i> Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Lost something on campus? <br/>
                <span className="text-primary">Let's find it together.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                The official lost and found portal for students and staff. Report lost items or help others find their belongings.
              </p>
              {!user && (
                 <div className="pt-4">
                    <Button onClick={handleLogin} className="text-lg px-8 py-3">
                      Get Started <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                 </div>
              )}
           </div>
           <div className="flex-1 flex justify-center md:justify-end">
              <div className="relative">
                  <div className="absolute -inset-4 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                  <i className="fas fa-search-location text-9xl text-primary relative z-10 opacity-90 transform -rotate-12"></i>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full md:w-96 focus-within:ring-2 focus-within:ring-primary transition-all">
            <i className="fas fa-search text-gray-400 mr-2"></i>
            <input 
              type="text" 
              placeholder="Search by name, location, or category..." 
              className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <button 
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
             >
               All Posts
             </button>
             <button 
                onClick={() => setFilterType('LOST')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'LOST' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
             >
               Lost Items
             </button>
             <button 
                onClick={() => setFilterType('FOUND')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'FOUND' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
             >
               Found Items
             </button>
          </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        {user && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:hidden fixed bottom-6 right-6 bg-accent text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
          >
            <i className="fas fa-plus text-2xl"></i>
          </button>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                isOwner={user?.uid === post.createdBy}
                onResolve={handleResolvePost}
                onDelete={handleDeletePost}
                onViewDetails={() => setSelectedPost(post)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-gray-300 mb-4">
              <i className="fas fa-box-open text-6xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-600">No posts found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            {user && (
              <Button variant="ghost" className="mt-4" onClick={() => setIsModalOpen(true)}>
                Create a new post
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Create Post Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
               <select 
                 className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                 value={formState.type}
                 onChange={(e) => setFormState({...formState, type: e.target.value as PostType})}
               >
                 <option value="LOST">I Lost something</option>
                 <option value="FOUND">I Found something</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
               <select 
                 className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                 value={formState.category}
                 onChange={(e) => setFormState({...formState, category: e.target.value})}
               >
                 {CATEGORIES.map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
               </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="e.g. Blue Jansport Backpack"
              value={formState.title}
              onChange={(e) => setFormState({...formState, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea 
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Provide details about color, size, distinct marks. This will be visible to everyone."
              value={formState.description}
              onChange={(e) => setFormState({...formState, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
              <input 
                required
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="e.g. Library 2nd Floor"
                value={formState.location}
                onChange={(e) => setFormState({...formState, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input 
                required
                type="date" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                value={formState.date}
                onChange={(e) => setFormState({...formState, date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={handleFileChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className="space-y-1">
                 <i className={`fas ${formState.imageFile ? 'fa-check-circle text-green-500' : 'fa-cloud-upload-alt text-gray-400'} text-2xl transition-colors`}></i>
                 <p className="text-sm text-gray-500 group-hover:text-primary transition-colors">
                    {formState.imageFile ? formState.imageFile.name : "Click to upload or drag and drop"}
                 </p>
               </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 bg-yellow-50 p-4 rounded-lg">
             <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
               <i className="fas fa-bullhorn text-accent"></i> Public Contact Information
             </h4>
             <p className="text-xs text-gray-500 mb-3">These details will be visible to all users so they can contact you.</p>
             <div className="grid grid-cols-1 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                 <input 
                   required
                   type="email" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-500 cursor-not-allowed"
                   value={formState.contactEmail}
                   readOnly
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                 <input 
                   type="tel" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                   placeholder="+1 (555) 000-0000"
                   value={formState.contactPhone}
                   onChange={(e) => setFormState({...formState, contactPhone: e.target.value})}
                 />
               </div>
             </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full py-3 text-lg" 
              isLoading={isSubmitting}
            >
              Submit Post
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post Details Modal */}
      <Modal 
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost ? selectedPost.title : ''}
      >
        {selectedPost && (
          <div className="space-y-4">
            {selectedPost.imageUrl && (
              <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full rounded-lg mb-2 max-h-64 object-cover" />
            )}
            <div>
              <span className="text-xs font-semibold text-secondary mb-1 block">{selectedPost.category}</span>
              <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{selectedPost.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{selectedPost.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <i className="fas fa-map-marker-alt w-4 text-center text-red-400"></i>
                <span>{selectedPost.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <i className="far fa-calendar-alt w-4 text-center text-blue-400"></i>
                <span>{new Date(selectedPost.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <i className="fas fa-user w-4 text-center text-gray-400"></i>
                <span>Posted by {selectedPost.creatorName}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <i className="fas fa-envelope text-primary"></i> Contact Poster
              </h4>
              <a href={`mailto:${selectedPost.contactEmail}?subject=Regarding your Lost/Found post: ${encodeURIComponent(selectedPost.title)}`}
                className="flex items-center gap-2 text-primary hover:underline text-sm mb-2">
                <i className="fas fa-envelope"></i> {selectedPost.contactEmail}
              </a>
              {selectedPost.contactPhone && (
                <a href={`tel:${selectedPost.contactPhone}`} className="flex items-center gap-2 text-primary hover:underline text-sm">
                  <i className="fas fa-phone"></i> {selectedPost.contactPhone}
                </a>
              )}
              {/* Message Button */}
              <button
                className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors"
                onClick={() => {
                  window.open(`mailto:${selectedPost.contactEmail}?subject=Message about your Lost/Found post: ${encodeURIComponent(selectedPost.title)}`);
                }}
              >
                <i className="fas fa-comment-dots"></i> Message Poster
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;