import React, { useState } from "react";
import InitMap from "@/components/mapTest/MapWithNewSearch";
import { APIProvider } from "@vis.gl/react-google-maps";

function Test() {

  const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';

  return (
        <APIProvider apiKey={apiKey}>
            <InitMap />
        </APIProvider>
  )
}

export default Test;


