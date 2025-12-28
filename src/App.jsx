import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Upload, X, Trash2, Pencil, Loader, Image as ImageIcon } from 'lucide-react';
import { loadMemories, saveMemory, updateMemory, deleteMemory, subscribeToMemories } from './firestoreService';

const FAMILIES = [
  "Chung",
  "Ông Phiếm - Bà Dịu",
  "Hà - Thủy",
  "Hùng - Giang",
  "Hiền - Hoan",
  "Hòa - Phương",
  "Khôi - Liên",
  "Hoa - Hà"
];

// Nén ảnh Canvas
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };
    };
    reader.readAsDataURL(file);
  });
};

function App() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newFamily, setNewFamily] = useState(FAMILIES[0]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [likedPosts, setLikedPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState('');
  const fileInputRef = useRef(null);

  // Load từ Firestore và subscribe real-time updates
  useEffect(() => {
    let unsubscribe = null;

    const setupData = async () => {
      try {
        console.log('🔄 Loading from Firestore...');
        // Load initial data
        const mems = await loadMemories();
        setMemories(mems);
        setLoading(false);
        console.log('✅ Loaded memories from Firestore');

        // Subscribe to real-time updates
        unsubscribe = subscribeToMemories((updatedMemories) => {
          setMemories(updatedMemories);
        });
      } catch (error) {
        console.error('❌ Load error:', error);
        setLoading(false);
      }
    };

    setupData();

    const savedLikedPosts = localStorage.getItem('family_liked_posts');
    if (savedLikedPosts) setLikedPosts(JSON.parse(savedLikedPosts));

    const savedUser = localStorage.getItem('family_app_user');
    if (savedUser) setCurrentUser(savedUser);

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Xử lý upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = await compressImage(file);
    setPreviewUrl(preview);
  };

  const handleSaveMemory = async () => {
    if (!previewUrl) return alert('Vui lòng chọn ảnh!');

    try {
      setIsUploading(true);
      const newMemory = {
        id: Date.now().toString(),
        caption: newCaption || 'Khoảnh khắc gia đình',
        family: newFamily,
        date: new Date().toISOString().split('T')[0],
        image: previewUrl,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      };
      
      await saveMemory(newMemory);
      const updatedMemories = [newMemory, ...memories];
      setMemories(updatedMemories);
      console.log('✅ Image saved to Firestore!');
      setNewCaption('');
      setPreviewUrl('');
      setIsUploading(false);
      setNewFamily(FAMILIES[0]);
      alert('Đã đăng kỷ niệm thành công!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Lỗi khi đăng ảnh: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleLike = async (id) => {
    if (likedPosts.includes(id)) return;
    
    try {
      const memory = memories.find(m => m.id === id);
      if (!memory) return;
      
      const updatedMemory = { ...memory, likes: (memory.likes || 0) + 1 };
      await updateMemory(id, { likes: updatedMemory.likes });
      
      const updatedMemories = memories.map(m => 
        m.id === id ? updatedMemory : m
      );
      setMemories(updatedMemories);
      const newLikedPosts = [...likedPosts, id];
      setLikedPosts(newLikedPosts);
      localStorage.setItem('family_liked_posts', JSON.stringify(newLikedPosts));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedMemory) return;

    let author = currentUser;
    if (!author) {
      author = window.prompt('Nhập tên của bạn:');
      if (!author) return;
      setCurrentUser(author);
      localStorage.setItem('family_app_user', author);
    }

    try {
      const comment = { author, text: newComment, time: new Date().toLocaleDateString('vi-VN') };
      const updatedComments = [...(selectedMemory.comments || []), comment];
      await updateMemory(selectedMemory.id, { comments: updatedComments });
      
      const updatedMemories = memories.map(m => 
        m.id === selectedMemory.id 
          ? { ...m, comments: updatedComments }
          : m
      );
      setMemories(updatedMemories);
      const updatedMemory = updatedMemories.find(m => m.id === selectedMemory.id);
      setSelectedMemory(updatedMemory);
      setNewComment('');
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa kỷ niệm này?')) return;
    
    try {
      await deleteMemory(id);
      const updatedMemories = memories.filter(m => m.id !== id);
      setMemories(updatedMemories);
      setSelectedMemory(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa kỷ niệm: ' + error.message);
    }
  };

  const handleUpdateCaption = async () => {
    if (!selectedMemory) return;
    
    try {
      await updateMemory(selectedMemory.id, { caption: editingCaption });
      const updatedMemories = memories.map(m => 
        m.id === selectedMemory.id 
          ? { ...m, caption: editingCaption }
          : m
      );
      setMemories(updatedMemories);
      const updatedMemory = updatedMemories.find(m => m.id === selectedMemory.id);
      setSelectedMemory(updatedMemory);
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      alert('Lỗi khi cập nhật: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 font-sans text-amber-900 pb-20">
      <header className="bg-amber-100/90 backdrop-blur-md sticky top-0 z-10 border-b border-amber-200 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-amber-800">Gia đình họ Đặng</h1>
            <p className="text-xs sm:text-sm text-amber-700 italic">Ông Phiếm & Bà Dịu - Kỷ niệm còn mãi</p>
          </div>
          <button 
            onClick={() => setIsUploading(true)} 
            className="flex items-center gap-2 bg-amber-800 text-amber-50 px-4 sm:px-5 py-2 rounded-full hover:bg-amber-900 transition-colors shadow-md text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Upload size={18} /><span className="hidden sm:inline">Tải lên kỷ niệm</span><span className="sm:hidden">Đăng ảnh</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="text-center py-20 text-amber-400">
            <Loader className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-base sm:text-lg">Đang tải kỷ niệm...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto mb-4 text-amber-300" size={64} />
            <p className="text-lg sm:text-xl text-amber-400 mb-4">Chưa có kỷ niệm nào...</p>
            <button 
              onClick={() => setIsUploading(true)}
              className="bg-amber-800 text-amber-50 px-6 py-3 rounded-full hover:bg-amber-900 transition-colors shadow-md"
            >
              Đăng ảnh đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {memories.map((mem) => (
              <div 
                key={mem.id} 
                className="group relative aspect-square bg-amber-200 overflow-hidden rounded-lg sm:rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                onClick={() => setSelectedMemory(mem)}
              >
                <img 
                  src={mem.image} 
                  alt={mem.caption} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 gap-4 text-white">
                  <div className="flex items-center gap-1 font-bold text-sm sm:text-base">
                    <Heart size={18} fill="white" /> {mem.likes || 0}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm sm:text-base">
                    <MessageCircle size={18} /> {mem.comments?.length || 0}
                  </div>
                </div>
                {mem.family && (
                  <div className="absolute bottom-2 left-2 text-white text-[10px] sm:text-xs bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full font-medium">
                    {mem.family}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="font-serif font-bold text-amber-900 text-base sm:text-lg">Thêm kỷ niệm mới</h3>
              <button 
                onClick={() => {
                  setIsUploading(false);
                  setPreviewUrl('');
                  setNewCaption('');
                }} 
                className="text-amber-500 hover:text-amber-800 p-1 hover:bg-amber-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto">
              <div 
                className="border-2 border-dashed border-amber-300 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:bg-amber-50 transition-colors active:bg-amber-100" 
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 sm:max-h-60 mx-auto rounded-lg shadow-md" />
                ) : (
                  <div className="flex flex-col items-center text-amber-400">
                    <Upload size={40} className="mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base">Nhấn để chọn ảnh</p>
                    <p className="text-xs text-amber-300 mt-1">JPG, PNG, WEBP</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <select 
                value={newFamily} 
                onChange={(e) => setNewFamily(e.target.value)} 
                className="w-full p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm sm:text-base"
              >
                {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <textarea 
                placeholder="Viết đôi dòng về kỷ niệm này..." 
                className="w-full p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm sm:text-base" 
                rows="3" 
                value={newCaption} 
                onChange={(e) => setNewCaption(e.target.value)}
              ></textarea>
              <button 
                onClick={handleSaveMemory} 
                disabled={isUploading || !previewUrl} 
                className="w-full bg-amber-800 text-white py-2.5 sm:py-3 rounded-xl font-bold hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-md"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin" size={18} />
                    Đang lưu...
                  </span>
                ) : (
                  'Đăng tải'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto" onClick={() => setSelectedMemory(null)}>
          <div className="bg-white rounded-none sm:rounded-xl w-full max-w-5xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl my-0 sm:my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center min-h-[40vh] sm:min-h-[50vh] md:min-h-0">
              <img src={selectedMemory.image} alt="Detail" className="max-h-[50vh] sm:max-h-[70vh] md:max-h-[90vh] w-full object-contain" />
            </div>
            <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-white border-t md:border-t-0 md:border-l max-h-[50vh] sm:max-h-[70vh] md:max-h-[90vh]">
              <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 sticky top-0 z-10">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base text-gray-800 truncate">{selectedMemory.family || 'Chung'}</p>
                  <p className="text-xs text-gray-500">{selectedMemory.date}</p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-2">
                  <button 
                    onClick={() => { setIsEditing(true); setEditingCaption(selectedMemory.caption); }} 
                    className="text-blue-500 hover:text-blue-700 p-1.5 sm:p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedMemory.id)} 
                    className="text-red-500 hover:text-red-700 p-1.5 sm:p-2 hover:bg-red-50 rounded transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button 
                    onClick={() => setSelectedMemory(null)} 
                    className="text-gray-500 hover:text-gray-800 p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Đóng"
                  >
                    <X size={18} className="sm:w-[20px] sm:h-[20px]" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold text-amber-800">GĐ</div>
                  <div className="text-sm sm:text-base w-full min-w-0">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea 
                          value={editingCaption} 
                          onChange={(e) => setEditingCaption(e.target.value)} 
                          className="w-full p-2 border border-amber-200 rounded-md text-sm sm:text-base focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none" 
                          rows="3"
                        ></textarea>
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setIsEditing(false)} 
                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={handleUpdateCaption} 
                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 break-words">{selectedMemory.caption}</p>
                    )}
                  </div>
                </div>
                
                {selectedMemory.comments && selectedMemory.comments.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    {selectedMemory.comments.map((cmt, idx) => (
                      <div key={idx} className="flex gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-600">
                          {cmt.author?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="text-sm sm:text-base w-full min-w-0">
                          <div className="bg-gray-100 p-2 sm:p-3 rounded-lg">
                            <p className="font-bold text-xs sm:text-sm text-amber-800 mb-1">{cmt.author}</p>
                            <p className="text-gray-700 break-words">{cmt.text}</p>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-400">{cmt.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 border-t bg-gradient-to-r from-gray-50 to-amber-50 sticky bottom-0">
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <button 
                    onClick={() => handleLike(selectedMemory.id)} 
                    disabled={likedPosts.includes(selectedMemory.id)} 
                    className="group disabled:cursor-not-allowed p-1 hover:bg-red-50 rounded-full transition-colors"
                    title="Thích"
                  >
                    <Heart 
                      size={20} 
                      className={likedPosts.includes(selectedMemory.id) ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover:text-red-400 transition-colors'} 
                    />
                  </button>
                  <MessageCircle className="text-gray-400" size={20} />
                </div>
                <p className="font-bold text-xs sm:text-sm text-gray-800 mb-2 sm:mb-3">{selectedMemory.likes || 0} lượt thích</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Thêm bình luận..." 
                    className="flex-1 text-xs sm:text-sm bg-white border border-amber-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} 
                  />
                  <button 
                    onClick={handleAddComment} 
                    className="text-amber-600 font-bold text-xs sm:text-sm hover:text-amber-800 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-amber-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={!newComment.trim()}
                  >
                    Đăng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
