import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export type Theme = 'amethyst' | 'solar' | 'nebula' | 'quasar';

interface VersVisualizerProps {
    analyser: AnalyserNode | null;
    isActive: boolean;
    theme: Theme;
    contextualColor: string | null;
}

const THEME_CONFIG = {
    amethyst: {
        geometry: () => new THREE.IcosahedronGeometry(1, 4),
        material: () => new THREE.MeshStandardMaterial({
            color: 0x8b5cf6, // indigo-500
            metalness: 0.8,
            roughness: 0.3,
            emissive: new THREE.Color(0x6366f1), // indigo-600
            emissiveIntensity: 0.2,
        }),
        light: { color: 0xa5b4fc, intensity: 5 },
    },
    solar: {
        geometry: () => new THREE.TorusKnotGeometry(0.7, 0.25, 128, 16),
        material: () => new THREE.MeshStandardMaterial({
            color: 0xfb923c, // orange-400
            metalness: 0.4,
            roughness: 0.5,
            emissive: new THREE.Color(0xf97316), // orange-500
            emissiveIntensity: 0.3,
        }),
        light: { color: 0xfcd34d, intensity: 6 }, // yellow-300
    },
    nebula: {
        geometry: () => new THREE.SphereGeometry(1, 64, 32),
        material: () => new THREE.MeshStandardMaterial({
            color: 0x22d3ee, // cyan-400
            metalness: 0.2,
            roughness: 0.6,
            emissive: new THREE.Color(0x06b6d4), // cyan-500
            emissiveIntensity: 0.3,
            sheen: 1,
            sheenColor: new THREE.Color(0x89f7fe),
            sheenRoughness: 0.5,
        }),
        light: { color: 0x67e8f9, intensity: 5 }, // cyan-300
    },
    quasar: {
        geometry: () => new THREE.OctahedronGeometry(1.2, 1),
        material: () => new THREE.MeshStandardMaterial({
            color: 0xe0f2fe, // sky-100
            metalness: 0.9,
            roughness: 0.2,
            emissive: new THREE.Color(0x7dd3fc), // sky-300
            emissiveIntensity: 0.25,
        }),
        light: { color: 0xffffff, intensity: 7 },
    },
};


export const VersVisualizer: React.FC<VersVisualizerProps> = ({ analyser, isActive, theme, contextualColor }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const pointLightRef = useRef<THREE.PointLight | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const isInitialMount = useRef(true);

    const targetLightColorRef = useRef(new THREE.Color());
    const targetEmissiveColorRef = useRef(new THREE.Color());

    useEffect(() => {
        const config = THEME_CONFIG[theme];
        const defaultLightColor = new THREE.Color(config.light.color);
        const defaultEmissiveColor = config.material().emissive as THREE.Color;

        if (contextualColor) {
            targetLightColorRef.current.set(contextualColor);
            targetEmissiveColorRef.current.set(contextualColor);
        } else {
            targetLightColorRef.current.copy(defaultLightColor);
            targetEmissiveColorRef.current.copy(defaultEmissiveColor);
        }
    }, [contextualColor, theme]);


    // Effect for theme changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (!sceneRef.current || !meshRef.current || !pointLightRef.current) return;
        
        const config = THEME_CONFIG[theme];

        // Update mesh
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();

        const newGeometry = config.geometry();
        const newMaterial = config.material();
        const newMesh = new THREE.Mesh(newGeometry, newMaterial);
        
        sceneRef.current.add(newMesh);
        meshRef.current = newMesh;

        // Update light
        pointLightRef.current.color.set(config.light.color);
        pointLightRef.current.userData.baseIntensity = config.light.intensity;
        pointLightRef.current.intensity = config.light.intensity;

    }, [theme]);


    // Effect for initial setup and animation loop
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 3;
        cameraRef.current = camera;
        
        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Initial Object and Light based on theme prop
        const config = THEME_CONFIG[theme];
        const geometry = config.geometry();
        const material = config.material();
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(config.light.color, config.light.intensity, 10);
        pointLight.position.set(0, 0, 2.5);
        pointLight.userData.baseIntensity = config.light.intensity;
        scene.add(pointLight);
        pointLightRef.current = pointLight;

        // Starfield
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(200);
            const y = THREE.MathUtils.randFloatSpread(200);
            const z = THREE.MathUtils.randFloatSpread(200);
            starVertices.push(x, y, z);
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.05 }); // slate-400
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Resize handler
        const handleResize = () => {
            if (mountRef.current && rendererRef.current && cameraRef.current) {
                const width = mountRef.current.clientWidth;
                const height = mountRef.current.clientHeight;
                rendererRef.current.setSize(width, height);
                cameraRef.current.aspect = width / height;
                cameraRef.current.updateProjectionMatrix();
            }
        };
        window.addEventListener('resize', handleResize);
        
        // Animation loop
        let dataArray: Uint8Array;
        if (analyser) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        const clock = new THREE.Clock();
        
        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();
            
            if (meshRef.current) {
                meshRef.current.rotation.x += 0.001;
                meshRef.current.rotation.y += 0.002;

                let smoothedFrequency = 0;
                if (analyser && dataArray && isActive) {
                    analyser.getByteFrequencyData(dataArray);
                    const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                    
                    const normalizedFrequency = Math.min(avgFrequency / 100, 1);
                    smoothedFrequency = THREE.MathUtils.lerp((meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity, normalizedFrequency * 2 + 0.2, 0.1);
                }
                
                const material = meshRef.current.material as THREE.MeshStandardMaterial;
                material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, isActive ? smoothedFrequency : 0.2, 0.05);
                material.emissive.lerp(targetEmissiveColorRef.current, 0.05);

                if (pointLightRef.current) {
                    pointLightRef.current.color.lerp(targetLightColorRef.current, 0.05);
                    const baseIntensity = pointLightRef.current.userData.baseIntensity || 5;
                    pointLightRef.current.intensity = THREE.MathUtils.lerp(pointLightRef.current.intensity, isActive ? smoothedFrequency * baseIntensity : baseIntensity, 0.05);
                }
                
                // Vertex displacement
                const positionAttribute = (meshRef.current.geometry as THREE.BufferGeometry).attributes.position;
                const originalPosition = (meshRef.current.geometry as any).userData.originalPosition;
                if (!originalPosition) {
                     (meshRef.current.geometry as any).userData.originalPosition = new Float32Array(positionAttribute.array);
                }
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    const ox = (meshRef.current.geometry as any).userData.originalPosition[i * 3];
                    const oy = (meshRef.current.geometry as any).userData.originalPosition[i * 3 + 1];
                    const oz = (meshRef.current.geometry as any).userData.originalPosition[i * 3 + 2];
                    
                    const vertex = new THREE.Vector3(ox, oy, oz).normalize();
                    const audioDisplacement = (isActive ? smoothedFrequency : 0.2) * 0.1;
                    const timeDisplacement = Math.sin(vertex.y * 5 + elapsedTime * 2) * 0.05;
                    const displacement = audioDisplacement + timeDisplacement;

                    positionAttribute.setXYZ(i, ox + vertex.x * displacement, oy + vertex.y * displacement, oz + vertex.z * displacement);
                }
                positionAttribute.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            scene.traverse(object => {
                if (object instanceof THREE.Mesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                         if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            (object.material as THREE.Material).dispose();
                        }
                    }
                }
            });
            renderer.dispose();
        };
    }, [analyser, isActive, theme]); // Rerun setup if analyser/isActive/theme changes

    return <div ref={mountRef} className="absolute inset-0 w-full h-full -z-10" />;
};