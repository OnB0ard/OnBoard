import { Button } from "@/components/ui/button"
import {Routes, Route} from "react-router-dom"

import Landing from './components/pages/Landing'
import Navbar from './components/organisms/Navbar'
import PlanList from './components/pages/PlanList'
import Test from './components/pages/test'
import Plan from './components/pages/Plan'

function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/Test" element={<Test/>} />
        <Route path="/list" element={<PlanList/>} />
        <Route path="/plan/:planId" element={<Plan/>} />
        {/* <Route path="/temp" element={<Temp/>} /> */}
      </Routes>
      

      
    </>
  )
}

export default App
