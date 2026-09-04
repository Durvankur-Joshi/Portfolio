import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { SKILLS_DATA, getSkillLogo } from './contentData';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { TextureLoader } from 'three';
import FloatingCodeParticles from './FloatingCodeParticles';
import { PositionalAudio, Text } from '@react-three/drei';
import { useAudio } from '../../../../context/AudioManager';
import { useStudioContent } from '../../../../hooks/useSanityData';
import '../../shaders/RevealMaterial';
import { usePaintMaterial } from '../Gallery/usePaintMaterial';

// ============================================
// ⚙️ PAINT CONFIGURATION - TWEAK HERE (Skąd-Dokąd)
// ============================================
const STUDIO_PAINT_CONFIG = {
    dirX: 0.0,
    dirY: -1.0,    // Direction: top (-1) to bottom
    dirZ: 0.0,
    startDist: -10.0,
    endDist: 10.0,
    noiseAxes: 'xz'
};

// ============================================
// ⚙️ AUDIO SETTINGS - TWEAK HERE
// ============================================
export const AUDIO_SETTINGS = {
    volume: 1,
    distance: 2,
    rolloff: 1.0
};

const StudioRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const groupRef = useRef();
    const towerRef = useRef();
    const { size } = useThree();

    // Responsive parameters based on pixel width
    const responsiveParams = useMemo(() => {
        const isMobile = size.width < 768;
        const isTablet = size.width < 1024 && size.width >= 768;

        return {
            scale: isMobile ? 0.75 : isTablet ? 0.88 : 1.0,
            radius: isMobile ? 0.8 : 1.0,
            isMobile,
        };
    }, [size.width]);

    // Drag interaction physics
    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const lastYRef = useRef(0);
    const dragDistance = useRef(0);

    const rotationVelocity = useRef(0);
    const autoRotationSpeed = useRef(0.0); // No continuous idle drift — moves only on drag/swipe
    const DRAG_SENSITIVITY = 0.006;
    const FRICTION = 0.97;

    // Scene Context & Achievements
    const { isTeleporting } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const { globalVolume, isMuted } = useAudio();
    const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

    // Sanity Data Bridge (preserved: receives Sanity data if present, otherwise authoritative SKILLS_DATA)
    const sanityContent = useStudioContent();

    const activeSkills = useMemo(() => {
        if (sanityContent && sanityContent.length > 0) {
            const hasCustomSkills = sanityContent.some(item => item.category || getSkillLogo(item.title));
            if (hasCustomSkills) {
                return sanityContent.map((item, idx) => ({
                    id: item.id || `sanity-skill-${idx}`,
                    name: item.title || item.name,
                    category: item.category || 'Skills',
                    logo: item.logo || getSkillLogo(item.title || item.name),
                    fallbackText: (item.title || item.name || 'SKL').substring(0, 3).toUpperCase(),
                    color: item.color || '#00e5ff'
                }));
            }
        }
        return SKILLS_DATA;
    }, [sanityContent]);

    const audioRef = useRef();
    useEffect(() => {
        if (audioRef.current && audioRef.current.setVolume) {
            audioRef.current.setVolume(effectiveVolume);
        }
    }, [effectiveVolume]);

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // ===== PAINT TRANSITION (top-to-bottom) =====
    const { onBeforeCompile: paintOnBeforeCompile, animatePaint, resetPaint, uniformsData: paintUniforms, updateRoomOrigin } = usePaintMaterial(STUDIO_PAINT_CONFIG);

    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                paintUniforms.uPaintProgress.value = 1.0;
            } else {
                resetPaint();
                animatePaint(0.2, 2.5);
            }
        } else {
            paintUniforms.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isTeleporting, animatePaint, resetPaint, paintUniforms]);

    // Track state for floating code particles parallax
    const particleTowerRotation = useRef(0);
    const particleFallOffset = useRef(0);

    // Track if we've signaled ready
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    useFrame(() => {
        updateRoomOrigin(groupRef);

        if (hasSignaledReady.current) return;

        frameCount.current++;
        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();
            if (!isWarmup) setTimeout(() => showTutorial('studio_interact'), 2000);
        }
    });

    // Generate vertical floating column layout for skills
    const floatingSkills = useMemo(() => {
        let seed = 42;
        const pseudoRand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        const count = activeSkills.length;
        const items = [];

        // Vertical cylindrical column configuration
        const SKILLS_PER_RING = 4;
        const ringsNeeded = Math.ceil(count / SKILLS_PER_RING);
        const VERTICAL_SPACING = 1.45;
        const towerRadius = 2.1 * responsiveParams.radius;

        for (let i = 0; i < count; i++) {
            const skill = activeSkills[i];
            const ring = Math.floor(i / SKILLS_PER_RING);
            const slot = i % SKILLS_PER_RING;

            // Stagger alternate rings by half an angle step for a balanced, staggered column
            const angleStep = (Math.PI * 2) / SKILLS_PER_RING;
            const angleOffset = (ring % 2) * (angleStep / 2);
            const angle = slot * angleStep + angleOffset;

            // Position on the vertical column cylinder
            const x = Math.sin(angle) * towerRadius;
            const y = (ring - (ringsNeeded - 1) / 2) * VERTICAL_SPACING + (pseudoRand() - 0.5) * 0.2;
            const z = Math.cos(angle) * towerRadius;

            items.push({
                ...skill,
                x,
                y,
                z,
                baseScale: (0.85 + pseudoRand() * 0.15) * responsiveParams.scale,
                rotX: (pseudoRand() - 0.5) * 0.08,
                rotY: angle, // Face outward from vertical column
                rotZ: (pseudoRand() - 0.5) * 0.08,
                driftSpeed: 0.35 + pseudoRand() * 0.35,
                floatAmplitude: 0.12 + pseudoRand() * 0.12,
                phaseOffset: pseudoRand() * Math.PI * 2,
            });
        }

        return items;
    }, [activeSkills, responsiveParams.radius, responsiveParams.scale]);

    // --- INTERACTION: Drag to explore / rotate the floating skills column ---
    const handlePointerDown = (e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        lastXRef.current = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        lastYRef.current = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
        dragDistance.current = 0;
        rotationVelocity.current = 0;
        document.body.style.cursor = 'grabbing';
    };

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'auto';
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!isDraggingRef.current || !towerRef.current) return;

        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
        if (!clientX || !clientY) return;

        const deltaX = clientX - lastXRef.current;
        const deltaY = clientY - lastYRef.current;
        lastXRef.current = clientX;
        lastYRef.current = clientY;

        dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);

        rotationVelocity.current = deltaX * DRAG_SENSITIVITY;
        towerRef.current.rotation.y += rotationVelocity.current;

        unlockAchievement('studio_interact');
    }, [unlockAchievement]);

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchmove', handlePointerMove);

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    // Drag inertia physics (stops cleanly with friction when idle — NO continuous drift)
    useFrame(() => {
        if (!towerRef.current) return;

        if (!isDraggingRef.current) {
            towerRef.current.rotation.y += rotationVelocity.current;
            rotationVelocity.current *= FRICTION;

            // Update particle refs directly for background parallax (no state re-renders)
            particleTowerRotation.current = towerRef.current.rotation.y;
            particleFallOffset.current = 0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>
            {!isWarmup && (
                <PositionalAudio
                    ref={audioRef}
                    url="/sounds/szummonitorow.mp3"
                    distanceModel="exponential"
                    refDistance={AUDIO_SETTINGS.distance}
                    rolloffFactor={AUDIO_SETTINGS.rolloff}
                    loop
                    autoplay
                    volume={effectiveVolume}
                />
            )}

            {/* THE FLOATING SKILLS VERTICAL COLUMN */}
            <group
                ref={towerRef}
                position={[0, 0.2, -8.0]}
                onPointerDown={handlePointerDown}
            >
                {/* Invisible Hit Cylinder for easier drag/rotate interaction */}
                <mesh visible={false}>
                    <cylinderGeometry args={[3.2, 3.2, 16, 16]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>

                {floatingSkills.map((item) => (
                    <FloatingSkillBadge
                        key={item.id}
                        item={item}
                        paintOnBeforeCompile={paintOnBeforeCompile}
                    />
                ))}
            </group>

            {/* Floating code symbols parallax background */}
            <FloatingCodeParticles
                towerRotationRef={particleTowerRotation}
                fallOffsetRef={particleFallOffset}
            />
        </group>
    );
};

// ===========================================
// FLOATING SKILL BADGE COMPONENT
// Pure 3D Showcase: Organic floating motion, subtle hover lifecycle, NO camera zoom / panel
// ===========================================
const FloatingSkillBadge = memo(({ item, paintOnBeforeCompile }) => {
    const groupRef = useRef();
    const isHoveredRef = useRef(false);

    // Hover animation states (interpolated smoothly inside useFrame)
    const hoverScale = useRef(1.0);
    const targetHoverScale = useRef(1.0);
    const hoverRotBoost = useRef(0.0);
    const targetHoverRotBoost = useRef(0.0);
    const hoverBrightness = useRef(0.0);
    const targetHoverBrightness = useRef(0.0);

    const { unlockAchievement } = useAchievements();

    // Safely load logo texture if defined
    let texture = null;
    try {
        if (item.logo) {
            texture = useLoader(TextureLoader, item.logo);
        }
    } catch {
        texture = null;
    }

    // Material for laboratory glass disc backing
    const discMaterial = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({
            color: '#121418',
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide
        });
        if (paintOnBeforeCompile) {
            mat.onBeforeCompile = paintOnBeforeCompile;
            mat.customProgramCacheKey = () => 'paint_skill_disc';
        }
        return mat;
    }, [paintOnBeforeCompile]);

    // Material for cyber ring border (tinted with skill theme color)
    const ringMaterial = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({
            color: item.color || '#00e5ff',
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide
        });
        if (paintOnBeforeCompile) {
            mat.onBeforeCompile = paintOnBeforeCompile;
            mat.customProgramCacheKey = () => `paint_skill_ring_${item.id}`;
        }
        return mat;
    }, [item.color, item.id, paintOnBeforeCompile]);

    // Material for logo texture (if exists)
    const logoMaterial = useMemo(() => {
        if (!texture) return null;
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.02
        });
        if (paintOnBeforeCompile) {
            mat.onBeforeCompile = paintOnBeforeCompile;
            mat.customProgramCacheKey = () => `paint_skill_logo_${item.id}`;
        }
        return mat;
    }, [texture, item.id, paintOnBeforeCompile]);

    // Frame update for continuous organic floating and smooth hover interpolation
    useFrame((state) => {
        const mesh = groupRef.current;
        if (!mesh) return;

        const time = state.clock.elapsedTime;

        // Smooth hover lifecycle: normal → hover → mouse leaves
        hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetHoverScale.current, 0.12);
        hoverRotBoost.current = THREE.MathUtils.lerp(hoverRotBoost.current, targetHoverRotBoost.current, 0.12);
        hoverBrightness.current = THREE.MathUtils.lerp(hoverBrightness.current, targetHoverBrightness.current, 0.12);

        // Apply scale
        const currentScale = item.baseScale * hoverScale.current;
        mesh.scale.set(currentScale, currentScale, currentScale);

        // Gentle independent floating movement along Y axis only
        const floatY = Math.sin(time * item.driftSpeed + item.phaseOffset) * item.floatAmplitude;

        mesh.position.x = item.x;
        mesh.position.y = item.y + floatY;
        mesh.position.z = item.z;

        // Subtle organic tilt + gentle hover tilt (in place)
        mesh.rotation.x = item.rotX + Math.sin(time * 0.3 + item.phaseOffset) * 0.04;
        mesh.rotation.y = item.rotY + hoverRotBoost.current;
        mesh.rotation.z = item.rotZ + Math.cos(time * 0.25 + item.phaseOffset) * 0.04;

        // Brighten ring border on hover
        if (ringMaterial) {
            ringMaterial.opacity = 0.55 + hoverBrightness.current * 0.4;
        }
    });

    const handlePointerOver = (e) => {
        e.stopPropagation();
        isHoveredRef.current = true;
        targetHoverScale.current = 1.18; // slightly larger
        targetHoverRotBoost.current = 0.22; // slightly more rotation
        targetHoverBrightness.current = 1.0; // slightly brighter
        document.body.style.cursor = 'pointer';
    };

    const handlePointerOut = () => {
        isHoveredRef.current = false;
        targetHoverScale.current = 1.0; // smoothly returns
        targetHoverRotBoost.current = 0.0;
        targetHoverBrightness.current = 0.0;
        document.body.style.cursor = 'auto';
    };

    const handleClick = (e) => {
        // Pure visual showcase: NO camera zoom, NO modal, NO panel
        e.stopPropagation();
        unlockAchievement('studio_interact');
    };

    return (
        <group
            ref={groupRef}
            position={[item.x, item.y, item.z]}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerUp={handleClick}
        >
            {/* Laboratory Glass Disc Backing */}
            <mesh material={discMaterial}>
                <circleGeometry args={[0.52, 32]} />
            </mesh>

            {/* Cyber Ring Border */}
            <mesh position={[0, 0, 0.005]} material={ringMaterial}>
                <ringGeometry args={[0.49, 0.53, 32]} />
            </mesh>

            {/* Logo Texture or Procedural Fallback Glyph */}
            {logoMaterial ? (
                <mesh position={[0, 0, 0.015]} material={logoMaterial}>
                    <planeGeometry args={[0.66, 0.66]} />
                </mesh>
            ) : (
                <Text
                    position={[0, 0, 0.02]}
                    font="/fonts/CabinSketch-Bold.ttf"
                    fontSize={0.28}
                    color={item.color || '#00e5ff'}
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.95}
                >
                    {item.fallbackText || item.name.substring(0, 3)}
                </Text>
            )}

            {/* Technology Name Label */}
            <Text
                position={[0, -0.66, 0.02]}
                font="/fonts/CabinSketch-Bold.ttf"
                fontSize={0.2}
                color="#111111"
                anchorX="center"
                anchorY="top"
                fillOpacity={0.9}
            >
                {item.name}
            </Text>
        </group>
    );
});

export default StudioRoom;
