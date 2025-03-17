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
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);

  // 📌 シェーダーを変更するたびに新しいマテリアルを作成
  useEffect(() => {
    const newMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      },
      vertexShader,
      fragmentShader,
    });

    setMaterial(newMaterial);
  }, [fragmentShader, viewport.width, viewport.height]);

  // 📌 外部から送信される新しいシェーダーを適用
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'updateShader') {
        console.log('Shader updated:', message.shader);
        setFragmentShader(message.shader);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setScale([viewport.width, viewport.height, 1]);
  }, [size, viewport]);

  // 📌 `uTime` を毎フレーム更新
  useFrame(({ clock }) => {
    if (material) {
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={ref} scale={scale}>
      <planeGeometry args={[1, 1]} />
      {material && <primitive object={material} attach="material" />}
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
