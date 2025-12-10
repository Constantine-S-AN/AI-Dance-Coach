import React, { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, ContactShadows } from '@react-three/drei';
import DancerAvatar from './DancerAvatar';
import { Landmark } from '../types';
import { DANCER_COLORS } from '../constants';

interface DanceStageProps {
  landmarks: Landmark[] | null;
}

const DanceStage: React.FC<DanceStageProps> = memo(({ landmarks }) => {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.2)] bg-black relative">
       <div className="absolute top-4 left-4 z-10 bg-black/80 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-none text-lg font-bold shadow-lg brand-font tracking-widest uppercase">
        NOVA SYSTEM
      </div>

      <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />
        
        {/* Fog helps visually separate foreground and background */}
        <fog attach="fog" args={['#050505', 5, 18]} />

        <ambientLight intensity={0.4} />
        
        <pointLight position={[10, 10, 10]} intensity={0.5} color={DANCER_COLORS.WHITE} />
        <pointLight position={[-5, 5, 2]} intensity={1.5} color={DANCER_COLORS.CYAN} />
        <pointLight position={[5, -2, 2]} intensity={1.5} color={DANCER_COLORS.PURPLE} />

        <Stars radius={80} depth={50} count={1500} factor={4} saturation={1} fade speed={0.5} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          sectionColor={DANCER_COLORS.PURPLE} 
          cellColor={DANCER_COLORS.CYAN} 
          sectionSize={2} 
          cellSize={1} 
          position={[0, -1.5, 0]}
        />

        <DancerAvatar landmarks={landmarks} />
        
        {/* Dynamic Shadow grounds the character to the floor */}
        <ContactShadows 
          opacity={0.8} 
          scale={10} 
          blur={2} 
          far={4} 
          resolution={256} 
          color={DANCER_COLORS.CYAN} 
          position={[0, -1.49, 0]}
        />

        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.8}
          enableZoom={false}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
});

export default DanceStage;
