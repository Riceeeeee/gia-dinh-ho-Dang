import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thêm dòng base dưới đây để chỉ định đường dẫn cho GitHub Pages
  base: '/gia-dinh-ho-Dang/', 
})