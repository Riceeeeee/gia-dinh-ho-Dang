// src/gistService.js
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_API = 'https://api.github.com';
let GIST_ID = import.meta.env.VITE_GITHUB_GIST_ID || null;

/**
 * Tạo Gist mới để lưu trữ memories
 */
export const createMemoriesGist = async () => {
  try {
    const response = await fetch(`${GITHUB_API}/gists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        description: 'Gia đình họ Đặng - Lưu giữ kỷ niệm',
        public: true,
        files: {
          'memories.json': {
            content: JSON.stringify({ memories: [], version: 1 })
          }
        }
      })
    });

    if (!response.ok) throw new Error('Failed to create gist');
    
    const gist = await response.json();
    GIST_ID = gist.id;
    localStorage.setItem('gist_id', GIST_ID);
    console.log('✅ Gist created:', GIST_ID);
    return GIST_ID;
  } catch (error) {
    console.error('❌ Create gist error:', error);
    throw error;
  }
};

/**
 * Load memories từ GitHub Gist
 */
export const loadMemories = async () => {
  try {
    const id = GIST_ID || localStorage.getItem('gist_id');
    if (!id) {
      console.log('No gist ID, creating new one...');
      await createMemoriesGist();
      return [];
    }

    const response = await fetch(`${GITHUB_API}/gists/${id}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });

    if (!response.ok) throw new Error('Failed to load gist');

    const gist = await response.json();
    const content = JSON.parse(gist.files['memories.json'].content);
    console.log(`📸 Loaded ${content.memories.length} memories`);
    return content.memories || [];
  } catch (error) {
    console.error('❌ Load memories error:', error);
    return [];
  }
};

/**
 * Lưu memories vào GitHub Gist
 */
export const saveMemories = async (memories) => {
  try {
    const id = GIST_ID || localStorage.getItem('gist_id');
    if (!id) {
      await createMemoriesGist();
      return saveMemories(memories);
    }

    const response = await fetch(`${GITHUB_API}/gists/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: {
          'memories.json': {
            content: JSON.stringify({ memories, version: 1, updatedAt: new Date().toISOString() })
          }
        }
      })
    });

    if (!response.ok) throw new Error('Failed to save gist');

    console.log('✅ Memories saved to gist');
    return true;
  } catch (error) {
    console.error('❌ Save memories error:', error);
    throw error;
  }
};

/**
 * Lấy Gist ID (dùng cho config)
 */
export const getGistId = () => {
  return GIST_ID || localStorage.getItem('gist_id');
};
