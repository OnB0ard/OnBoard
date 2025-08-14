import {Routes, Route} from "react-router-dom"

import Landing from './components/pages/Landing'
import Navbar from './components/organisms/Navbar'
import PlanList from './components/pages/PlanList'
import Test from './components/pages/test'
import PlanPage from './components/pages/PlanPage'
import MyPage from "./components/pages/MyPage"
import PrivateRoute from './router/PrivateRoute'
import PlanAccessRoute from './router/PlanAccessRoute'
import NotFound from './components/pages/NotFound'
import { useAuthStore } from './store/useAuthStore'
import { ToastProvider } from '@/components/atoms/Toast'

function App() {
  // 프로필 변경 시 마이페이지를 remount시키기 위한 키
  const userName = useAuthStore((s) => s.userName)
  const profileImage = useAuthStore((s) => s.profileImage)

  return (
    <ToastProvider>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/Test" element={<Test/>} />
        <Route element={<PrivateRoute />}>
          <Route path="/list" element={<PlanList/>} />
          {/* 프로필 변경 시 키를 바꿔 강제 remount */}
          <Route path="/mypage" element={<MyPage key={`${userName}-${profileImage}`} />} />
        </Route>
        <Route element={<PlanAccessRoute />}>
          <Route path="/plan/:planId" element={<PlanPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        <Route path="/not-found" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
// 