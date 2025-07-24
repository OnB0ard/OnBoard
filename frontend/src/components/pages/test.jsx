import React, { useState } from "react";
import SettingModal from "@/components/organisms/SettingModal";

function Test() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    
        <div className="flex h-screen items-center justify-center flex-col gap-4">

            <button onClick={() => setIsModalOpen(true)}>Test</button>
            <SettingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    
  )
}

export default Test;
