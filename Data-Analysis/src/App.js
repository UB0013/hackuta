import React from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene from "./components/Scene";
import LandingContent from "./components/LandingContent";
import GradientOverlay from "./components/GradientOverlay";
import FloatingParticles from "./components/FloatingParticles";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 1 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <GradientOverlay />
      <FloatingParticles />
      <LandingContent />
    </div>
  );
}

export default App;
