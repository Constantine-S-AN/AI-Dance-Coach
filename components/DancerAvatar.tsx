import React, { useRef } from 'react';
import { Vector3, Euler, Quaternion, CylinderGeometry, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { Landmark } from '../types';
import { DANCER_COLORS, POSE_LANDMARKS } from '../constants';

interface DancerAvatarProps {
  landmarks: Landmark[] | null;
}

// --- STATIC ASSETS ---
const UNIT_CYLINDER = new CylinderGeometry(1, 1, 1, 8);
UNIT_CYLINDER.center(); 
const UNIT_SPHERE = new SphereGeometry(1, 12, 12);

const MAT_JOINT_GLOW = new MeshBasicMaterial({ color: DANCER_COLORS.CYAN });
const MAT_JOINT_PURPLE = new MeshStandardMaterial({ color: DANCER_COLORS.PURPLE, roughness: 0.3, metalness: 0.8 });
const MAT_JOINT_GREY = new MeshStandardMaterial({ color: DANCER_COLORS.GREY, roughness: 0.3, metalness: 0.8 });
const MAT_LIMB_GREY = new MeshStandardMaterial({ color: DANCER_COLORS.GREY, roughness: 0.3, metalness: 0.8 });
const MAT_LIMB_WHITE = new MeshStandardMaterial({ color: DANCER_COLORS.WHITE, roughness: 0.3, metalness: 0.8 });
const MAT_LIMB_GLOW = new MeshBasicMaterial({ color: DANCER_COLORS.CYAN });

const Limb: React.FC<{ start: Vector3; end: Vector3; material: any; thickness?: number }> = React.memo(({ start, end, material, thickness = 0.08 }) => {
  const length = start.distanceTo(end);
  if (length < 0.001) return null;

  const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new Vector3().subVectors(end, start).normalize();
  const up = new Vector3(0, 1, 0);
  const quaternion = new Quaternion().setFromUnitVectors(up, direction);
  const rotation = new Euler().setFromQuaternion(quaternion);

  return (
    <mesh 
      position={midPoint} 
      rotation={rotation} 
      scale={[thickness, length, thickness]} 
      geometry={UNIT_CYLINDER} 
      material={material} 
    />
  );
});

const Joint: React.FC<{ position: Vector3; material: any; size?: number }> = React.memo(({ position, material, size = 0.12 }) => {
  return (
    <mesh 
      position={position} 
      scale={[size, size, size]} 
      geometry={UNIT_SPHERE} 
      material={material} 
    />
  );
});

const DancerAvatar: React.FC<DancerAvatarProps> = ({ landmarks }) => {
  // Smoothing refs
  const smoothScale = useRef(4.0);
  const smoothZOffset = useRef(0.0);
  
  // Frame loop for smoothing logic (though we calculate per render here for simplicity as props update fast)
  // In a heavier app we might put this in useFrame, but React render cycle is driven by Pose frames anyway.

  if (!landmarks || landmarks.length === 0) return null;

  // --- ROBUST DEPTH ESTIMATION ---
  // Use Torso Length (Mid-Shoulder to Mid-Hip) instead of width.
  // This is invariant to rotation (turning sideways).
  
  const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
  const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
  const midHipX = (lHip.x + rHip.x) / 2;
  const midHipY = (lHip.y + rHip.y) / 2;

  // Calculate vertical-ish distance on screen
  const torsoLengthScreen = Math.sqrt(
    Math.pow(midShoulderX - midHipX, 2) + 
    Math.pow(midShoulderY - midHipY, 2)
  );

  // --- CALIBRATION ---
  // Reference: When user is at "standard" distance (Z=0), torso length is roughly 0.25 of screen height
  const REFERENCE_TORSO_LEN = 0.22; 
  const WORLD_SKELETON_SCALE = 1.2; // Physical size of the robot in world units

  // 1. SCALE: Normalize the skeleton size.
  // We want the skeleton to be Constant World Size.
  // ScreenSize * ScaleFactor = WorldSize
  // ScaleFactor = WorldSize / ScreenSize
  const targetScale = WORLD_SKELETON_SCALE / Math.max(0.05, torsoLengthScreen);

  // 2. DEPTH: Physics-based perspective mapping.
  // Distance = Constant / ScreenSize.
  // We know Camera is at Z = 5.
  // We want Z_Avatar = 0 when torsoLength = REFERENCE_TORSO_LEN.
  // Distance_Ref = 5.0.
  // Constant K = Distance_Ref * REFERENCE_TORSO_LEN = 5 * 0.22 = 1.1.
  
  const CAMERA_Z = 5.0;
  const K = CAMERA_Z * REFERENCE_TORSO_LEN;
  
  // Calculated Distance from Camera
  const calculatedDistance = K / Math.max(0.05, torsoLengthScreen);
  
  // Z Position = CameraZ - Distance
  // Clamp so we don't crash into camera (min distance 1.0)
  let targetZOffset = CAMERA_Z - Math.max(1.5, calculatedDistance);

  // Apply Low-Pass Filter (Smoothing)
  const LERP = 0.2;
  smoothScale.current += (targetScale - smoothScale.current) * LERP;
  smoothZOffset.current += (targetZOffset - smoothZOffset.current) * LERP;

  // --- PROJECTION ---
  const toVector = (lm: Landmark): Vector3 => {
    // X: Flip for mirror, center at 0.5
    const x = (0.5 - lm.x) * smoothScale.current;
    
    // Y: Invert Y (0 is top in MP, +Y is up in 3D).
    // Offset calculation: We want hips (~0.6 screen Y usually) to be roughly at World Y=0 or slightly below.
    const y = (0.5 - lm.y) * smoothScale.current + 0.2; 
    
    // Z: Local depth from MP (scaled slightly less to flatten self-occlusion artifacts)
    // + Global Depth Offset
    const zLocal = -lm.z * smoothScale.current * 0.5;
    const zGlobal = smoothZOffset.current;

    return new Vector3(x, y, zLocal + zGlobal);
  };

  // Convert all landmarks
  const coords = {
    nose: toVector(landmarks[POSE_LANDMARKS.NOSE]),
    lShoulder: toVector(landmarks[POSE_LANDMARKS.LEFT_SHOULDER]),
    rShoulder: toVector(landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]),
    lElbow: toVector(landmarks[POSE_LANDMARKS.LEFT_ELBOW]),
    rElbow: toVector(landmarks[POSE_LANDMARKS.RIGHT_ELBOW]),
    lWrist: toVector(landmarks[POSE_LANDMARKS.LEFT_WRIST]),
    rWrist: toVector(landmarks[POSE_LANDMARKS.RIGHT_WRIST]),
    lHip: toVector(landmarks[POSE_LANDMARKS.LEFT_HIP]),
    rHip: toVector(landmarks[POSE_LANDMARKS.RIGHT_HIP]),
    lKnee: toVector(landmarks[POSE_LANDMARKS.LEFT_KNEE]),
    rKnee: toVector(landmarks[POSE_LANDMARKS.RIGHT_KNEE]),
    lAnkle: toVector(landmarks[POSE_LANDMARKS.LEFT_ANKLE]),
    rAnkle: toVector(landmarks[POSE_LANDMARKS.RIGHT_ANKLE]),
  };

  const neck = new Vector3().addVectors(coords.lShoulder, coords.rShoulder).multiplyScalar(0.5);
  const pelvis = new Vector3().addVectors(coords.lHip, coords.rHip).multiplyScalar(0.5);
  
  // Adjust head position
  const headPos = coords.nose.clone().add(new Vector3(0, 0.15 * (smoothScale.current / 4), 0));

  return (
    <group>
      {/* HEAD */}
      <mesh position={headPos}>
        <capsuleGeometry args={[0.22, 0.3, 4, 16]} />
        <meshStandardMaterial color={DANCER_COLORS.DARK} metalness={0.9} roughness={0.2} />
      </mesh>
      
      {/* VISOR */}
      <mesh position={[headPos.x, headPos.y + 0.05, headPos.z + 0.18]}>
         <boxGeometry args={[0.25, 0.1, 0.15]} />
         <meshBasicMaterial color={DANCER_COLORS.CYAN} />
      </mesh>
      
      {/* Halo Ring */}
      <mesh position={[headPos.x, headPos.y + 0.3, headPos.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 12]} />
        <meshBasicMaterial color={DANCER_COLORS.PURPLE} />
      </mesh>

      {/* TORSO */}
      <Limb start={neck} end={pelvis} material={MAT_LIMB_GREY} thickness={0.28} />
      <Limb start={neck} end={pelvis} material={MAT_LIMB_GLOW} thickness={0.05} />

      {/* ARMS */}
      <Joint position={coords.lShoulder} material={MAT_JOINT_GLOW} size={0.14} />
      <Limb start={coords.lShoulder} end={coords.lElbow} material={MAT_LIMB_WHITE} />
      <Joint position={coords.lElbow} material={MAT_JOINT_GREY} />
      <Limb start={coords.lElbow} end={coords.lWrist} material={MAT_LIMB_WHITE} />
      <Joint position={coords.lWrist} material={MAT_JOINT_GLOW} size={0.08} />

      <Joint position={coords.rShoulder} material={MAT_JOINT_GLOW} size={0.14} />
      <Limb start={coords.rShoulder} end={coords.rElbow} material={MAT_LIMB_WHITE} />
      <Joint position={coords.rElbow} material={MAT_JOINT_GREY} />
      <Limb start={coords.rElbow} end={coords.rWrist} material={MAT_LIMB_WHITE} />
      <Joint position={coords.rWrist} material={MAT_JOINT_GLOW} size={0.08} />

      {/* LEGS */}
      <Joint position={coords.lHip} material={MAT_JOINT_PURPLE} size={0.14} />
      <Limb start={coords.lHip} end={coords.lKnee} material={MAT_LIMB_GREY} thickness={0.12} />
      <Joint position={coords.lKnee} material={MAT_JOINT_PURPLE} />
      <Limb start={coords.lKnee} end={coords.lAnkle} material={MAT_LIMB_GREY} thickness={0.1} />
      <Joint position={coords.lAnkle} material={MAT_JOINT_GLOW} size={0.1} />

      <Joint position={coords.rHip} material={MAT_JOINT_PURPLE} size={0.14} />
      <Limb start={coords.rHip} end={coords.rKnee} material={MAT_LIMB_GREY} thickness={0.12} />
      <Joint position={coords.rKnee} material={MAT_JOINT_PURPLE} />
      <Limb start={coords.rKnee} end={coords.rAnkle} material={MAT_LIMB_GREY} thickness={0.1} />
      <Joint position={coords.rAnkle} material={MAT_JOINT_GLOW} size={0.1} />
      
    </group>
  );
};

export default DancerAvatar;