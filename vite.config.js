import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // เพิ่มส่วนนี้เพื่อแก้ปัญหาการ Build ค้าง
    rollupOptions: {
      external: [], 
    },
    // เพิ่มการจัดการ WASM ให้ชัดเจนขึ้น
    target: 'esnext' 
  },
  optimizeDeps: {
    exclude: ['@firebase/auth', '@firebase/firestore'] // บังคับให้ Vite ไม่ต้องพยายาม Compile lib เหล่านี้ซ้ำ
  }
})