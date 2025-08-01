import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// Zustand store와 apiClient 연결을 위한 추가 import
import { useAuthStore } from '@/store/useAuthStore';
import { setAccessTokenGetter } from '@/apis/apiClient';

//Portal 용 DOM 노드 생성
const modalRootId = 'modal-root';
let modalRoot = document.getElementById(modalRootId);
if(!modalRoot){
  modalRoot = document.createElement('div');
  modalRoot.id = modalRootId;
  document.body.appendChild(modalRoot);
}

setAccessTokenGetter(() => useAuthStore.getState().accessToken);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* BrowserRouter : 브라우저의 현재 주소를 저장하고 감지하는 역할 */}
  </StrictMode>,
)
