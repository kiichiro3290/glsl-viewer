import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const defaultFragmentShader = `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uResolution;

  void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      gl_FragColor = vec4(uv, abs(sin(uTime)), 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ShaderPlane = () => {
  const ref = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const [scale, setScale] = useState<[number, number, number]>([viewport.width, viewport.height, 1]);
  const [fragmentShader, setFragmentShader] = useState<string>(defaultFragmentShader);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message?.type === 'updateShader') {
        console.log('updateShader', message.shader);
        setFragmentShader(message.shader);
      }
    });

    return () => {
      window.removeEventListener('message', () => {});
    };
  }, []);

  useEffect(() => {
    setScale([viewport.width, viewport.height, 1]);
  }, [size, viewport]);

  // フレームごとに `uTime` を更新
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as any).uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={ref} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial uniforms={{
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      }} fragmentShader={`${fragmentShader}`} vertexShader={`${vertexShader}`} />
    </mesh>
  );
};

export function App() {
  return (
    <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }}>
      <ShaderPlane />
    </Canvas>
  );
}
