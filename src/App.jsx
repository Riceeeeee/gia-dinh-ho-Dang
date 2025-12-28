import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Upload, X, Trash2, Pencil, Loader } from 'lucide-react';
import { loadMemories, saveMemories, getGistId, createMemoriesGist } from './gistService';

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

  // Load từ GitHub Gist
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading from GitHub Gist...');
        const mems = await loadMemories();
        setMemories(mems);
        setLoading(false);
        console.log('✅ Gist ID:', getGistId());
      } catch (error) {
        console.error('❌ Load error:', error);
        setLoading(false);
      }
    };

    loadData();

    const savedLikedPosts = localStorage.getItem('family_liked_posts');
    if (savedLikedPosts) setLikedPosts(JSON.parse(savedLikedPosts));

    const savedUser = localStorage.getItem('family_app_user');
    if (savedUser) setCurrentUser(savedUser);
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
      };
      
      const updatedMemories = [newMemory, ...memories];
      await saveMemories(updatedMemories);
      
      setMemories(updatedMemories);
      console.log('✅ Image saved to Gist!');
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
      const updatedMemories = memories.map(m => 
        m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m
      );
      await saveMemories(updatedMemories);
      
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
      const updatedMemories = memories.map(m => 
        m.id === selectedMemory.id 
          ? { ...m, comments: [...(m.comments || []), comment] }
          : m
      );
      await saveMemories(updatedMemories);
      
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
      const updatedMemories = memories.filter(m => m.id !== id);
      await saveMemories(updatedMemories);
      
      setMemories(updatedMemories);
      setSelectedMemory(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleUpdateCaption = async () => {
    if (!selectedMemory) return;
    
    try {
      const updatedMemories = memories.map(m => 
        m.id === selectedMemory.id 
          ? { ...m, caption: editingCaption }
          : m
      );
      await saveMemories(updatedMemories);
      
      setMemories(updatedMemories);
      const updatedMemory = updatedMemories.find(m => m.id === selectedMemory.id);
      setSelectedMemory(updatedMemory);
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 font-sans text-amber-900 pb-20">
      <header className="bg-amber-100/80 backdrop-blur-md sticky top-0 z-10 border-b border-amber-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-800">Gia đình họ Đặng</h1>
            <p className="text-sm text-amber-700 italic">Ông Phiếm & Bà Dịu - Kỷ niệm còn mãi</p>
          </div>
          <button onClick={() => setIsUploading(true)} className="flex items-center gap-2 bg-amber-800 text-amber-50 px-5 py-2 rounded-full hover:bg-amber-900 transition-colors shadow-md">
            <Upload size={18} /><span>Tải lên kỷ niệm</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-amber-400"><Loader className="animate-spin mx-auto mb-4" /><p>Đang tải kỷ niệm...</p></div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20 text-amber-400"><p className="text-xl">Chưa có kỷ niệm nào...</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {memories.map((mem) => (
              <div key={mem.id} className="group relative aspect-square bg-amber-200 overflow-hidden rounded-lg cursor-pointer shadow-sm hover:shadow-lg transition-all" onClick={() => setSelectedMemory(mem)}>
                <img src={mem.imageUrl} alt={mem.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                  <div className="flex items-center gap-1 font-bold"><Heart size={20} fill="white" /> {mem.likes || 0}</div>
                  <div className="flex items-center gap-1 font-bold"><MessageCircle size={20} /> {mem.comments?.length || 0}</div>
                </div>
                {mem.family && <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">{mem.family}</div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50">
              <h3 className="font-serif font-bold text-amber-900">Thêm kỷ niệm mới</h3>
              <button onClick={() => setIsUploading(false)} className="text-amber-500 hover:text-amber-800"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:bg-amber-50" onClick={() => fileInputRef.current.click()}>
                {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded-lg" /> : <div className="flex flex-col items-center text-amber-400"><Upload size={48} className="mb-2" /><p>Nhấn để chọn ảnh</p></div>}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
              <select value={newFamily} onChange={(e) => setNewFamily(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-amber-500">
                {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <textarea placeholder="Viết đôi dòng..." className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-amber-500" rows="3" value={newCaption} onChange={(e) => setNewCaption(e.target.value)}></textarea>
              <button onClick={handleSaveMemory} disabled={isUploading} className="w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 disabled:opacity-50">{isUploading ? 'Đang lưu...' : 'Đăng tải'}</button>
            </div>
          </div>
        </div>
      )}

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedMemory(null)}>
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center">
              <img src={selectedMemory.imageUrl} alt="Detail" className="max-h-[90vh] w-full object-contain" />
            </div>
            <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-white border-l">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-800">{selectedMemory.family || 'Chung'}</p>
                  <p className="text-xs text-gray-500">{selectedMemory.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setIsEditing(true); setEditingCaption(selectedMemory.caption); }} className="text-blue-500 hover:text-blue-700 p-2"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(selectedMemory.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                  <button onClick={() => setSelectedMemory(null)} className="text-gray-500 hover:text-gray-800 p-2"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-xs">GĐ</div>
                  <div className="text-sm w-full">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} className="w-full p-2 border rounded-md text-sm" rows="3"></textarea>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Hủy</button>
                          <button onClick={handleUpdateCaption} className="text-xs px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">Lưu</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{selectedMemory.caption}</p>
                    )}
                  </div>
                </div>
                
                {selectedMemory.comments && selectedMemory.comments.map((cmt, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {cmt.author?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="text-sm w-full">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <p className="font-bold text-xs text-amber-800">{cmt.author}</p>
                        <p className="text-gray-700">{cmt.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{cmt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-4 mb-3">
                  <button onClick={() => handleLike(selectedMemory.id)} disabled={likedPosts.includes(selectedMemory.id)} className="group disabled:cursor-not-allowed">
                    <Heart className={likedPosts.includes(selectedMemory.id) ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover:text-red-400'} />
                  </button>
                  <MessageCircle className="text-gray-400" />
                </div>
                <p className="font-bold text-sm text-gray-800 mb-2">{selectedMemory.likes || 0} lượt thích</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Thêm bình luận..." className="flex-1 text-sm bg-white border rounded-full px-4 py-2 focus:outline-none focus:border-amber-400" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} />
                  <button onClick={handleAddComment} className="text-amber-600 font-bold text-sm hover:text-amber-800" disabled={!newComment.trim()}>Đăng</button>
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
