import React from 'react';
import { useParams } from 'react-router-dom';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import Map from '../organisms/Map';
import EditToolBar from '../organisms/EditToolBar';

 
const Plan = () => {
  const { planId } = useParams();

  return (
    <div>
      <SideBar />
      <WhiteBoard />
      <EditToolBar />
      <Map />
    </div>
  );
};

export default Plan;