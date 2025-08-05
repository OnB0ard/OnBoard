import { Button } from "@/components/ui/button"
import {Routes, Route} from "react-router-dom"

import Landing from './components/pages/Landing'
import Navbar from './components/organisms/Navbar'
import PlanList from './components/pages/PlanList'
import Test from './components/pages/Test'
import PlanPage from './components/pages/PlanPage'
import MyPage from "./components/pages/Mypage"
import PrivateRoute from './router/PrivateRoute'


function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/Test" element={<Test/>} />
        <Route element={<PrivateRoute />}>
          <Route path="/list" element={<PlanList/>} />
          <Route path="/plan/:planId" element={<PlanPage/>} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
        {/* <Route path="/temp" element={<Temp/>} /> */}
      </Routes>
    </>
  )
}

export default App
