import './App.css'
import {Routes, Route} from "react-router-dom"

import Landing from './components/pages/Landing'
import Navbar from './components/organisms/Navbar'

function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Landing/>} />
        {/* <Route path="/temp" element={<Temp/>} /> */}
      </Routes>
      
    </>
  )
}

export default App
