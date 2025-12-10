import React from 'react';
import { Vector3, Euler, Quaternion } from 'three';
import { Landmark } from '../types';
import { SPIDEY_COLORS, POSE_LANDMARKS } from '../constants';

interface SpidermanAvatarProps {
  landmarks: Landmark[] | null;
}

const Limb: React.FC<{ start: Vector3; end: Vector3; color: string; thickness?: number }> = ({ start, end, color, thickness = 0.08 }) => {
  const length = start.distanceTo(end);
  const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  
  // Calculate rotation to align cylinder with start-end vector
  const direction = new Vector3().subVectors(end, start).normalize();
  const up = new Vector3(0, 1, 0);
  const quaternion = new Quaternion().setFromUnitVectors(up, direction);
  const rotation = new Euler().setFromQuaternion(quaternion);

  return (
    <mesh position={midPoint} rotation={rotation}>
      <cylinderGeometry args={[thickness, thickness, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
    </mesh>
  );
};

const Joint: React.FC<{ position: Vector3; color: string; size?: number }> = ({ position, color, size = 0.12 }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
};

// Helper to convert MP coords (0-1, inverted Y) to 3D world coords
const toVector = (lm: Landmark): Vector3 => {
  // Center roughly at 0,0. Scale up.
  // MP: x (0 left, 1 right), y (0 top, 1 bottom)
  return new Vector3(
    (0.5 - lm.x) * 4,     // Flip X for mirror
    (0.5 - lm.y) * 4 + 1, // Flip Y, shift up
    -lm.z * 4             // Scale Z depth
  );
};

const SpidermanAvatar: React.FC<SpidermanAvatarProps> = ({ landmarks }) => {
  if (!landmarks || landmarks.length === 0) return null;

  // Extract Key Points
  const l = landmarks;
  const nose = toVector(l[POSE_LANDMARKS.NOSE]);
  const lShoulder = toVector(l[POSE_LANDMARKS.LEFT_SHOULDER]);
  const rShoulder = toVector(l[POSE_LANDMARKS.RIGHT_SHOULDER]);
  const lElbow = toVector(l[POSE_LANDMARKS.LEFT_ELBOW]);
  const rElbow = toVector(l[POSE_LANDMARKS.RIGHT_ELBOW]);
  const lWrist = toVector(l[POSE_LANDMARKS.LEFT_WRIST]);
  const rWrist = toVector(l[POSE_LANDMARKS.RIGHT_WRIST]);
  const lHip = toVector(l[POSE_LANDMARKS.LEFT_HIP]);
  const rHip = toVector(l[POSE_LANDMARKS.RIGHT_HIP]);
  const lKnee = toVector(l[POSE_LANDMARKS.LEFT_KNEE]);
  const rKnee = toVector(l[POSE_LANDMARKS.RIGHT_KNEE]);
  const lAnkle = toVector(l[POSE_LANDMARKS.LEFT_ANKLE]);
  const rAnkle = toVector(l[POSE_LANDMARKS.RIGHT_ANKLE]);

  // Derived Points
  const neck = new Vector3().addVectors(lShoulder, rShoulder).multiplyScalar(0.5);
  const pelvis = new Vector3().addVectors(lHip, rHip).multiplyScalar(0.5);
  
  // Head needs to sit above the nose roughly
  const headPos = nose.clone().add(new Vector3(0, 0.2, 0));

  return (
    <group>
      {/* HEAD */}
      <mesh position={headPos}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={SPIDEY_COLORS.RED} />
      </mesh>
      {/* EYES (Simple white patches) */}
      <mesh position={[headPos.x - 0.08, headPos.y + 0.05, headPos.z + 0.2]}>
         <sphereGeometry args={[0.06, 16, 16]} />
         <meshBasicMaterial color={SPIDEY_COLORS.WHITE} />
      </mesh>
       <mesh position={[headPos.x + 0.08, headPos.y + 0.05, headPos.z + 0.2]}>
         <sphereGeometry args={[0.06, 16, 16]} />
         <meshBasicMaterial color={SPIDEY_COLORS.WHITE} />
      </mesh>

      {/* TORSO */}
      <Limb start={neck} end={pelvis} color={SPIDEY_COLORS.BLUE} thickness={0.25} />

      {/* ARMS (Red Upper, Blue Lower - Simplification for style) */}
      <Joint position={lShoulder} color={SPIDEY_COLORS.RED} />
      <Limb start={lShoulder} end={lElbow} color={SPIDEY_COLORS.RED} />
      <Joint position={lElbow} color={SPIDEY_COLORS.RED} />
      <Limb start={lElbow} end={lWrist} color={SPIDEY_COLORS.BLUE} />
      <Joint position={lWrist} color={SPIDEY_COLORS.RED} size={0.08} />

      <Joint position={rShoulder} color={SPIDEY_COLORS.RED} />
      <Limb start={rShoulder} end={rElbow} color={SPIDEY_COLORS.RED} />
      <Joint position={rElbow} color={SPIDEY_COLORS.RED} />
      <Limb start={rElbow} end={rWrist} color={SPIDEY_COLORS.BLUE} />
      <Joint position={rWrist} color={SPIDEY_COLORS.RED} size={0.08} />

      {/* LEGS (Blue Upper, Red Lower) */}
      <Joint position={lHip} color={SPIDEY_COLORS.BLUE} />
      <Limb start={lHip} end={lKnee} color={SPIDEY_COLORS.BLUE} />
      <Joint position={lKnee} color={SPIDEY_COLORS.RED} />
      <Limb start={lKnee} end={lAnkle} color={SPIDEY_COLORS.RED} />
      <Joint position={lAnkle} color={SPIDEY_COLORS.RED} size={0.1} />

      <Joint position={rHip} color={SPIDEY_COLORS.BLUE} />
      <Limb start={rHip} end={rKnee} color={SPIDEY_COLORS.BLUE} />
      <Joint position={rKnee} color={SPIDEY_COLORS.RED} />
      <Limb start={rKnee} end={rAnkle} color={SPIDEY_COLORS.RED} />
      <Joint position={rAnkle} color={SPIDEY_COLORS.RED} size={0.1} />
      
    </group>
  );
};

export default SpidermanAvatar;