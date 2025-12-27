import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Upload, X, Calendar, Image as ImageIcon, Video, Search, Trash2, Pencil, Users } from 'lucide-react';

/**
 * Ứng dụng: Gia đình họ Đặng - Lưu giữ kỷ niệm
 * Tác giả: Chuyên gia React (Mô phỏng)
 * * Cấu trúc dữ liệu (Data Structure):
 * Kỷ niệm (Memory): { id, type, url, caption, date, family: string, likes, comments }
 * Bình luận (Comment): { author: string, text: string, time: string }
 */

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

const App = () => {
  // --- KHỞI TẠO STATE (TRẠNG THÁI) ---
  const [memories, setMemories] = useState(() => {
    const saved = localStorage.getItem('family_memories');
    return saved ? JSON.parse(saved) : [];
  });

  // State cho bộ lọc
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFamily, setFilterFamily] = useState('all');

  // State cho modal
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State cho form upload
  const [newCaption, setNewCaption] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [newFamily, setNewFamily] = useState(FAMILIES[0]);
  const fileInputRef = useRef(null);

  // State cho tương tác
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState('');
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

  // --- HIỆU ỨNG (EFFECTS) ---

  useEffect(() => {
    localStorage.setItem('family_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    const savedLikedPosts = localStorage.getItem('family_liked_posts');
    if (savedLikedPosts) setLikedPosts(JSON.parse(savedLikedPosts));

    const savedUser = localStorage.getItem('family_app_user');
    if (savedUser) setCurrentUser(savedUser);
  }, []);

  useEffect(() => {
    if (selectedMemory) setIsEditing(false);
  }, [selectedMemory?.id]);


  // --- CÁC HÀM XỬ LÝ (HANDLERS) ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMemory = () => {
    if (!previewUrl) return alert("Vui lòng chọn ảnh hoặc video!");
    const newMemory = {
      id: Date.now(),
      type: newFile?.type.startsWith('video') ? 'video' : 'image',
      url: previewUrl,
      caption: newCaption || 'Khoảnh khắc gia đình',
      family: newFamily,
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: []
    };
    setMemories([newMemory, ...memories]);
    setNewCaption(''); setNewFile(null); setPreviewUrl(''); setIsUploading(false); setNewFamily(FAMILIES[0]);
  };

  const handleLike = (id) => {
    if (likedPosts.includes(id)) return;
    const updatedMemories = memories.map(mem => mem.id === id ? { ...mem, likes: mem.likes + 1 } : mem);
    setMemories(updatedMemories);
    if (selectedMemory?.id === id) setSelectedMemory(prev => ({ ...prev, likes: prev.likes + 1 }));
    const newLikedPosts = [...likedPosts, id];
    setLikedPosts(newLikedPosts);
    localStorage.setItem('family_liked_posts', JSON.stringify(newLikedPosts));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedMemory) return;

    let author = currentUser;
    if (!author) {
      const newAuthor = window.prompt("Vui lòng nhập tên của bạn để bình luận:", "");
      if (newAuthor && newAuthor.trim()) {
        author = newAuthor.trim();
        setCurrentUser(author);
        localStorage.setItem('family_app_user', author);
      } else {
        return; 
      }
    }

    const commentObj = { author, text: newComment, time: new Date().toLocaleDateString('vi-VN') };
    const updatedMemories = memories.map(mem => mem.id === selectedMemory.id ? { ...mem, comments: [...mem.comments, commentObj] } : mem);
    setMemories(updatedMemories);
    setSelectedMemory(prev => ({ ...prev, comments: [...prev.comments, commentObj] }));
    setNewComment('');
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kỷ niệm này vĩnh viễn không?")) {
      setMemories(memories.filter(mem => mem.id !== id));
      setSelectedMemory(null);
    }
  };

  const handleEdit = () => {
    if (!selectedMemory) return;
    setIsEditing(true);
    setEditingCaption(selectedMemory.caption);
  };

  const handleUpdateCaption = () => {
    if (!selectedMemory) return;
    const updatedMemories = memories.map(mem => mem.id === selectedMemory.id ? { ...mem, caption: editingCaption } : mem);
    setMemories(updatedMemories);
    setSelectedMemory(prev => ({ ...prev, caption: editingCaption }));
    setIsEditing(false);
  };

  const filteredMemories = memories.filter(mem => 
    (filterDate ? mem.date === filterDate : true) && 
    (filterType === 'all' ? true : mem.type === filterType) &&
    (filterFamily === 'all' ? true : mem.family === filterFamily)
  );

  // --- RENDER ---
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center justify-between border border-amber-100">
          <div className="flex items-center gap-2 text-amber-800 font-medium"><Search size={20} /><span>Bộ lọc:</span></div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Calendar size={16} className="text-amber-600" /><input type="date" className="bg-transparent outline-none text-sm text-amber-900" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <select className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-sm text-amber-900 outline-none cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Tất cả thể loại</option><option value="image">Chỉ Ảnh</option><option value="video">Chỉ Video</option>
            </select>
            <select className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-sm text-amber-900 outline-none cursor-pointer" value={filterFamily} onChange={(e) => setFilterFamily(e.target.value)}>
              <option value="all">Tất cả gia đình</option>
              {FAMILIES.map(family => <option key={family} value={family}>{family}</option>)}
            </select>
            {(filterDate || filterType !== 'all' || filterFamily !== 'all') && (<button onClick={() => { setFilterDate(''); setFilterType('all'); setFilterFamily('all'); }} className="text-xs text-amber-600 hover:underline">Xóa bộ lọc</button>)}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-20 text-amber-400"><p className="text-xl">Chưa có kỷ niệm nào phù hợp...</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-6">
            {filteredMemories.map((mem) => (
              <div key={mem.id} className="group relative aspect-square bg-amber-200 overflow-hidden rounded-lg cursor-pointer shadow-sm hover:shadow-lg transition-all" onClick={() => setSelectedMemory(mem)}>
                {mem.type === 'video' ? <video src={mem.url} className="w-full h-full object-cover" /> : <img src={mem.url} alt={mem.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                  <div className="flex items-center gap-1 font-bold"><Heart size={20} fill="white" /> {mem.likes}</div>
                  <div className="flex items-center gap-1 font-bold"><MessageCircle size={20} /> {mem.comments.length}</div>
                </div>
                <div className="absolute top-2 right-2 text-white drop-shadow-md">{mem.type === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}</div>
                {mem.family && <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">{mem.family}</div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50"><h3 className="font-serif font-bold text-amber-900">Thêm kỷ niệm mới</h3><button onClick={() => setIsUploading(false)} className="text-amber-500 hover:text-amber-800"><X size={24} /></button></div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center cursor-pointer hover:bg-amber-50" onClick={() => fileInputRef.current.click()}>
                {previewUrl ? (newFile?.type.startsWith('video') ? <video src={previewUrl} className="max-h-60 mx-auto rounded-lg" controls /> : <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded-lg shadow-md" />) : (<div className="flex flex-col items-center text-amber-400"><Upload size={48} className="mb-2" /><p>Nhấn để chọn Ảnh hoặc Video</p></div>)}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
              </div>
              <select value={newFamily} onChange={(e) => setNewFamily(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-amber-500">
                {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <textarea placeholder="Viết đôi dòng tâm sự..." className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-amber-500" rows="3" value={newCaption} onChange={(e) => setNewCaption(e.target.value)}></textarea>
              <button onClick={handleSaveMemory} className="w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 active:scale-95">Đăng tải</button>
            </div>
          </div>
        </div>
      )}

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedMemory(null)}>
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center bg-amber-50/10">
              {selectedMemory.type === 'video' ? <video src={selectedMemory.url} controls className="max-h-[50vh] md:max-h-[90vh] w-full object-contain" /> : <img src={selectedMemory.url} alt="Detail" className="max-h-[50vh] md:max-h-[90vh] w-full object-contain" />}
            </div>
            <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-white border-l">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold font-serif">GĐ</div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{selectedMemory.family || 'Chung'}</p>
                    <p className="text-xs text-gray-500">{selectedMemory.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleEdit} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100" title="Chỉnh sửa"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(selectedMemory.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" title="Xóa kỷ niệm"><Trash2 size={18} /></button>
                    <button onClick={() => setSelectedMemory(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-xs">GĐ</div>
                  <div className="text-sm">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} className="w-full p-2 border rounded-md text-sm" rows="4"></textarea>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300">Hủy</button>
                          <button onClick={handleUpdateCaption} className="text-xs px-3 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700">Lưu</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold mr-2">Lời tựa:</span>
                        <span className="text-gray-700">{selectedMemory.caption}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {selectedMemory.comments.map((cmt, idx) => (
                  <div key={idx} className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {cmt.author ? cmt.author.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="text-sm w-full">
                      <div className="bg-gray-100 p-2 rounded-r-lg rounded-bl-lg">
                        <p className="font-bold text-xs text-amber-800">{cmt.author || 'Người dùng ẩn danh'}</p>
                        <p className="text-gray-700">{cmt.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 pl-1">{cmt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-4 mb-3">
                  <button onClick={() => handleLike(selectedMemory.id)} disabled={likedPosts.includes(selectedMemory.id)} className="group disabled:cursor-not-allowed">
                    <Heart className={`transition-colors ${likedPosts.includes(selectedMemory.id) ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover:text-red-400'}`} />
                  </button>
                  <MessageCircle className="text-gray-400" />
                </div>
                <p className="font-bold text-sm text-gray-800 mb-2">{selectedMemory.likes} lượt thích</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Thêm bình luận..." className="flex-1 text-sm bg-white border rounded-full px-4 py-2 focus:outline-none focus:border-amber-400" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} />
                  <button onClick={handleAddComment} className="text-amber-600 font-bold text-sm hover:text-amber-800 disabled:opacity-50" disabled={!newComment.trim()}>Đăng</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;