import { Component, useMemo, useRef, useEffect, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/theme";

const MAX_TEX = 768;

function useScaledTexture(url: string) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setTex(null);
    setFailed(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      try {
        const scale = Math.min(1, MAX_TEX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d ctx");
        ctx.drawImage(img, 0, 0, w, h);
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 2;
        setTex(t);
      } catch {
        setFailed(true);
      }
    };
    img.onerror = () => {
      if (alive) setFailed(true);
    };
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);

  return { tex, failed };
}

function PedestalRing({ radius, tube, speed, color }: { radius: number; tube: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh | null>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 12, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.6} roughness={0.3} transparent opacity={0.7} />
    </mesh>
  );
}

function ProductCard3D({ image }: { image: string }) {
  const { tex, failed } = useScaledTexture(image);
  const auto = useRef<THREE.Group | null>(null);
  useFrame((state) => {
    if (auto.current) {
      auto.current.rotation.y = state.clock.elapsedTime * 0.35;
    }
  });

  const { w, h } = useMemo(() => {
    const aspect = tex && tex.image.width > 0 && tex.image.height > 0
      ? Math.min(2, Math.max(0.5, tex.image.width / tex.image.height))
      : 1;
    const ww = 3.4;
    return { w: ww, h: ww / aspect };
  }, [tex]);

  if (failed || !tex) return null;

  return (
    <group ref={auto}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[w + 0.1, h + 0.1]} />
        <meshStandardMaterial color="#7aa2ff" emissive="#7aa2ff" emissiveIntensity={0.25} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

class HoloBoundary extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false };
  static getDerivedStateFromError() {
    return { broken: true };
  }
  render() {
    return this.state.broken ? null : this.props.children;
  }
}

function HoloCanvas({ image }: { image: string }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.4, 7], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 5, 6]} intensity={1.4} color="#7aa2ff" />
      <pointLight position={[-5, -1, 4]} intensity={1} color="#fdd502" />
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.7}>
        <group position={[0, 0.55, 0]}>
          <ProductCard3D image={image} />
        </group>
      </Float>
      <PedestalRing radius={2.6} tube={0.05} speed={0.25} color="#fdd502" />
      <PedestalRing radius={3.2} tube={0.03} speed={-0.16} color="#7aa2ff" />
      <Sparkles count={60} scale={[9, 6, 6]} size={2.2} speed={0.35} color="#fdd502" opacity={0.6} />
    </Canvas>
  );
}

export function HoloStage({ image, name }: { image: string; name: string }) {
  const { theme, reducedMotion } = useTheme();
  const show = theme === "void" && !reducedMotion;

  return (
    <div
      className="holo-stage"
      role="img"
      aria-label={name}
      style={{ display: show ? undefined : "none" }}
    >
      <HoloBoundary>
        <HoloCanvas image={image} />
      </HoloBoundary>
    </div>
  );
}