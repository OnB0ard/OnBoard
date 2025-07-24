import { Button } from "@/components/ui/button"
import {Routes, Route} from "react-router-dom"

import Landing from './components/pages/Landing'
import Navbar from './components/organisms/Navbar'
import PlanList from './components/pages/PlanList'
import Test from './components/pages/test'

function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/Test" element={<Test/>} />
        <Route path="/planlist" element={<PlanList/>} />
        <Route path="/Test" element={<Test/>}/>
        {/* <Route path="/temp" element={<Temp/>} /> */}
      </Routes>
      

      
    </>
  )
}

export default App
