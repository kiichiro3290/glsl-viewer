import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { button, useControls } from 'leva';
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
  const [scale, setScale] = useState<[number, number, number]>([
    viewport.width,
    viewport.height,
    1,
  ]);
  const [fragmentShader, setFragmentShader] = useState<string>(
    defaultFragmentShader,
  );
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);

  // 📌 シェーダーを変更するたびに新しいマテリアルを作成
  useEffect(() => {
    const newMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(viewport.width, viewport.height),
        },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader,
      fragmentShader,
    });

    setMaterial(newMaterial);

    const handleMouseMove = (event: PointerEvent) => {
      if (!newMaterial.uniforms.uMouse) return;
      const { clientX, clientY } = event;
      newMaterial.uniforms.uMouse.value.set(
        clientX / window.innerWidth,
        1.0 - clientY / window.innerHeight,
      );
    };

    window.addEventListener('pointermove', handleMouseMove);

    return () => {
      window.removeEventListener('pointermove', handleMouseMove);
    };
  }, [fragmentShader, viewport.width, viewport.height]);

  // 📌 外部から送信される新しいシェーダーを適用
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'updateShader') {
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

const Scene = ({
  width,
  height,
  setWidth,
  setHeight,
}: {
  width: number;
  height: number;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}) => {
  const gl = useThree((state) => state.gl);

  useControls({
    screenshot: button(() => {
      const link = document.createElement('a');
      link.setAttribute('download', 'canvas.png');
      link.setAttribute(
        'href',
        gl.domElement
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream'),
      );
      link.click();
    }),
    width: {
      value: width,
      min: 400,
      max: 1920,
      step: 10,
      onChange: (value) => setWidth(value),
    },
    height: {
      value: height,
      min: 300,
      max: 1080,
      step: 10,
      onChange: (value) => setHeight(value),
    },
  });

  return <ShaderPlane />;
};

export function App() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width,
          height,
          border: '1px solid black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
          style={{ width, height }}
        >
          <Scene
            width={width}
            height={height}
            setWidth={setWidth}
            setHeight={setHeight}
          />
        </Canvas>
      </div>
    </div>
  );
}
