import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec3 color = vec3(0.5 + 0.5 * sin(uTime + vUv.x * 10.0),
                      0.5 + 0.5 * cos(uTime + vUv.y * 10.0),
                      0.5);
    gl_FragColor = vec4(color, 1.0);
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

  useEffect(() => {
    setScale([viewport.width, viewport.height, 1]);
  }, [size, viewport]);

  // フレームごとに `uTime` を更新
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as any).uTime = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={ref} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial uniforms={{
        uTime: { value: 0.0 },
      }} fragmentShader={`${fragmentShader}`} vertexShader={`${vertexShader}`} />
    </mesh>
  );
};

export function App() {
  useEffect(() => {
    window.addEventListener('message', (event) => {
      const _message = event.data;
    });

    return () => {
      window.removeEventListener('message', () => {});
    };
  }, []);

  return (
    <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }}>
      <ShaderPlane />
    </Canvas>
  );
}
