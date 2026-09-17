import { useState, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import SkyChunk, { CHUNK_LENGTH, ROOM_Z } from './SkyChunk';
import { isTouchDevice } from '../../../../utils/deviceDetect';
import { useAboutProfile } from '../../../../hooks/useSanityData';
import { useAudio } from '../../../../context/AudioManager';

/**
 * InfiniteSkyManager Component
 *
 * Manages dynamic generation/removal of sky chunks for infinite scroll.
 * World group moves with scroll, chunks stay at fixed positions relative to group.
 * Includes Story Milestones that loop with the content!
 *
 * Story arc (content driven by aboutProfile from Sanity / fallback):
 *   Slot 1 (z=-15):  INTRO      — name + headline
 *   Slot 2 (z=-55):  EDUCATION  — B.E. island (left), Diploma island (right)
 *   Slot 3 (z=-95):  BUILDING   — projects panel (left), open source panel (right)
 *   Slot 4 (z=-135): ONWARD     — achievement card (left), focus areas (right)
 */

// Story milestones configuration
// Each milestone appears once per "story cycle" (4 chunks = 160 units)
const STORY_CYCLE_LENGTH = 160;

// === TWARDA LINIA ZANIKANIA DLA MILESTONES (WORLD SPACE) ===
// Pokój About jest na Z = -25, więc -25 to drzwi pokoju
// -8 = krawędź widzialności (musi matchować CORRIDOR_CLIP_Z w SkyChunk)
const MILESTONE_CORRIDOR_CLIP_Z = -8.0;

// ─────────────────────────────────────────────────────────────────────────────
// InfiniteSkyManager
// ─────────────────────────────────────────────────────────────────────────────
const InfiniteSkyManager = ({ scrollProgressRef }) => {
    const aboutProfile = useAboutProfile();

    // PRE-CALCULATED FOR scrollProgress = 0
    // currentChunk = floor(0/40) = 0 -> [-1, 0, 1, 2]
    const [activeChunks, setActiveChunks] = useState([-1, 0, 1, 2]);
    // currentStoryCycle = floor(0/160) = 0 -> [-1, 0, 1]
    const [activeStoryCycles, setActiveStoryCycles] = useState([-1, 0, 1]);
    const worldRef = useRef();

    const getCurrentChunk = (worldZ) => Math.floor(worldZ / CHUNK_LENGTH);
    const getCurrentStoryCycle = (worldZ) => Math.floor(worldZ / STORY_CYCLE_LENGTH);

    useFrame(() => {
        if (!worldRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;

        // Move world directly
        worldRef.current.position.z = scrollProgress;

        // Figure out which chunk we're in
        const currentChunk = getCurrentChunk(scrollProgress);
        const shouldBeActiveChunks = [
            currentChunk - 1,
            currentChunk,
            currentChunk + 1,
            currentChunk + 2,
        ];

        const chunksNeedUpdate = shouldBeActiveChunks.some(c => !activeChunks.includes(c)) ||
            activeChunks.some(c => !shouldBeActiveChunks.includes(c));

        if (chunksNeedUpdate) {
            setActiveChunks(shouldBeActiveChunks);
        }

        // Update story cycles
        const currentStoryCycle = getCurrentStoryCycle(scrollProgress);
        const shouldBeActiveCycles = [
            currentStoryCycle - 1,
            currentStoryCycle,
            currentStoryCycle + 1,
        ];

        const cyclesNeedUpdate = shouldBeActiveCycles.some(c => !activeStoryCycles.includes(c)) ||
            activeStoryCycles.some(c => !shouldBeActiveCycles.includes(c));

        if (cyclesNeedUpdate) {
            setActiveStoryCycles(shouldBeActiveCycles);
        }
    });

    return (
        <group ref={worldRef}>
            {/* === SKY CHUNKS WITH CLOUDS === */}
            {activeChunks.map((chunkIndex) => (
                <SkyChunk
                    key={`sky-chunk-${chunkIndex}`}
                    chunkIndex={chunkIndex}
                    seed={42}
                    scrollProgressRef={scrollProgressRef}
                />
            ))}

            {/* === STORY MILESTONES (loop every 160 units) === */}
            {activeStoryCycles.map((cycleIndex) => (
                <group key={`story-cycle-${cycleIndex}`}>
                    {/* === INTRO MILESTONE (z=-15) === */}
                    <IntroMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 15)}
                        scrollProgressRef={scrollProgressRef}
                        profile={aboutProfile}
                    />

                    {/* === EDUCATION MILESTONE (z=-55) === */}
                    <EducationMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)}
                        scrollProgressRef={scrollProgressRef}
                        education={aboutProfile.education}
                    />

                    {/* === BUILDING / OPEN SOURCE MILESTONE (z=-95) === */}
                    <BuildingMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                        scrollProgressRef={scrollProgressRef}
                        highlights={aboutProfile.highlights}
                        openSource={aboutProfile.openSource}
                    />

                    {/* === ACHIEVEMENT / FOCUS MILESTONE (z=-135) === */}
                    <FocusMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)}
                        scrollProgressRef={scrollProgressRef}
                        achievements={aboutProfile.achievements}
                    />
                </group>
            ))}
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// INTRO Milestone — Name + Headline + Avatar cloud
// Elements spread apart as they approach the camera
// ─────────────────────────────────────────────────────────────────────────────
const IntroMilestone = ({ z, scrollProgressRef, profile }) => {
    const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.webp');
    const isTouch = isTouchDevice();

    const groupRef = useRef();
    const titleRef = useRef();
    const brandRef = useRef();
    const avatarRef = useRef();
    const motto1Ref = useRef();
    const motto2Ref = useRef();

    const baseY = 2;

    // LEGACY FIX: Use original dimensions (2816x1536) to prevent stretching
    const legacyAspectRatio = 2816 / 1536;
    const avatarWidth = 6;
    const avatarHeight = avatarWidth / legacyAspectRatio;

    // Destructure profile safely
    const name = profile?.name || 'DURVANKUR JOSHI';
    const headline = profile?.headline || 'Computer Engineering Student • AI & Full-Stack Developer';

    // Split headline on bullet (•) for two lines
    const headlineParts = headline.split('•').map(s => s.trim());
    const headlineLine1 = headlineParts[0] || headline;
    const headlineLine2 = headlineParts[1] || null;

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        // Consistent distance for spread animation
        const distanceZ = z + scrollProgress - 55;

        // === EDYTUJ TUTAJ (INTRO) ===
        const spreadStart = -70;
        const spreadEnd = -50;
        let spreadFactor = 0;

        if (distanceZ > spreadStart && distanceZ < spreadEnd) {
            spreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
            spreadFactor = Math.min(1, Math.max(0, spreadFactor));
            spreadFactor = spreadFactor * spreadFactor; // ease in
        } else if (distanceZ >= spreadEnd) {
            spreadFactor = 1;
        }

        const maxSpread = 15;

        if (titleRef.current) {
            titleRef.current.position.x = -spreadFactor * maxSpread * 0.8;
        }
        if (brandRef.current) {
            brandRef.current.position.x = spreadFactor * maxSpread * 0.6;
        }
        if (avatarRef.current) {
            avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 3;
            avatarRef.current.position.x = -spreadFactor * maxSpread * 0.3;
        }
        if (motto1Ref.current) {
            motto1Ref.current.position.x = spreadFactor * maxSpread * 0.7;
        }
        if (motto2Ref.current) {
            motto2Ref.current.position.x = -spreadFactor * maxSpread * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Main title — Name (spreads left) */}
            <Text
                ref={titleRef}
                position={[0, 5, 0.1]}
                fontSize={0.8}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                {name}
            </Text>

            {/* Subtitle — Line 1 (spreads right) */}
            <Text
                ref={brandRef}
                position={[0, 4.2, 0.1]}
                fontSize={0.38}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                {headlineLine1}
            </Text>

            {/* Avatar on cloud — floating + spreads up-left */}
            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial
                    color="#e0e0e0"
                    map={avatarTexture}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Headline Line 2 (spreads right) */}
            {headlineLine2 && (
                <Text
                    ref={motto1Ref}
                    position={[0, -0.2, 0.1]}
                    fontSize={0.35}
                    color="#555555"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Regular.ttf"
                >
                    {headlineLine2}
                </Text>
            )}

            {/* Location / context line (spreads left) */}
            <Text
                ref={motto2Ref}
                position={[0, headlineLine2 ? -0.7 : -0.2, 0]}
                fontSize={0.32}
                color="#777777"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                Pune, India
            </Text>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION Milestone — Two floating islands: B.E. (left) and Diploma (right)
// Reuses existing island float animation pattern from original JourneyMilestone
// ─────────────────────────────────────────────────────────────────────────────
const EducationMilestone = ({ z, scrollProgressRef, education }) => {
    const groupRef = useRef();
    const beRef = useRef();
    const diplomaRef = useRef();

    // Reuse existing island textures
    const beTexture = useLoader(THREE.TextureLoader, '/textures/about/uowyspa.webp');
    const diplomaTexture = useLoader(THREE.TextureLoader, '/textures/about/freelancewyspa.webp');
    beTexture.colorSpace = THREE.SRGBColorSpace;
    diplomaTexture.colorSpace = THREE.SRGBColorSpace;

    // LEGACY FIX: Use original dimensions (2816x1536)
    const islandLegacyAspect = 2816 / 1536;
    const islandHeight = 4.5;

    // Safe-access education entries with resume-derived fallbacks
    const be = education?.[0] || {
        institution: 'A.I.E.T.P',
        degree: 'Computer Engineering',
        score: '87.54%',
        period: '2022-2025',
    };
    const diploma = education?.[1] || {
        institution: 'GCOEARA',
        degree: 'Computer Engineering',
        score: 'CGPA:8.36',
        period: '2025–2028',
    };

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const time = state.clock.elapsedTime;
        const distanceZ = z + scrollProgress - 55;

        // === EDYTUJ TUTAJ (EDUCATION REVEAL) ===
        const revealStart = -100;
        const revealEnd = -20;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 2); // ease out quad
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // B.E. Island (Left) — float up + bob
        if (beRef.current) {
            const startY = -2;
            const endY = 1.5;
            const currentBaseY = startY + revealFactor * (endY - startY);
            beRef.current.position.y = currentBaseY + Math.sin(time * 0.5) * 0.2;
            beRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
        }

        // Diploma Island (Right) — float up + bob (offset phase)
        if (diplomaRef.current) {
            const startY = -1;
            const endY = 2.5;
            const currentBaseY = startY + revealFactor * (endY - startY);
            diplomaRef.current.position.y = currentBaseY + Math.sin(time * 0.4 + 2) * 0.25;
            diplomaRef.current.rotation.z = Math.sin(time * 0.2 + 1) * -0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 5, 0.3]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                EDUCATION
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 4.2, 0.3]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                My academic journey
            </Text>

            {/* === B.E. ISLAND (Left) === */}
            <group ref={beRef} position={[-3.5, -1, 0]}>
                <mesh>
                    <planeGeometry args={[islandHeight * islandLegacyAspect, islandHeight]} />
                    <meshBasicMaterial
                        color="#e0e0e0"
                        map={beTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* Degree */}
                <Text
                    position={[0, -0.3, 0.1]}
                    fontSize={0.38}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                    maxWidth={7}
                    textAlign="center"
                >
                    {be.degree}
                </Text>
                {/* Score + Period */}
                <Text
                    position={[0, -0.85, 0.1]}
                    fontSize={0.35}
                    color="#333333"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Regular.ttf"
                >
                    {be.score} • {be.period}
                </Text>
            </group>

            {/* === DIPLOMA ISLAND (Right) === */}
            <group ref={diplomaRef} position={[3.5, -2, 0.5]}>
                <mesh>
                    <planeGeometry args={[islandHeight * islandLegacyAspect, islandHeight]} />
                    <meshBasicMaterial
                        color="#e0e0e0"
                        map={diplomaTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* Degree */}
                <Text
                    position={[0, -0.25, 0.1]}
                    fontSize={0.38}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                    maxWidth={7}
                    textAlign="center"
                >
                    {diploma.degree}
                </Text>
                {/* Score + Period */}
                <Text
                    position={[0, -0.85, 0.1]}
                    fontSize={0.35}
                    color="#333333"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Regular.ttf"
                >
                    {diploma.score} • {diploma.period}
                </Text>
            </group>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILDING Milestone — Projects panel (left) + Open Source panel (right)
// Cards slide in from the sides as the user approaches
// ─────────────────────────────────────────────────────────────────────────────
const BuildingMilestone = ({ z, scrollProgressRef, highlights, openSource }) => {
    const groupRef = useRef();
    const leftRef = useRef();
    const rightRef = useRef();

    // Safe defaults
    const projects = (highlights || []).filter(h => h.type === 'project').slice(0, 3);
    const oss = openSource?.[0] || null;

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const time = state.clock.elapsedTime;
        const distanceZ = z + scrollProgress - 55;

        // === EDYTUJ TUTAJ (BUILDING REVEAL) ===
        const revealStart = -100;
        const revealEnd = -20;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 2);
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        if (leftRef.current) {
            const startY = -2;
            const endY = 0.5;
            leftRef.current.position.y = startY + revealFactor * (endY - startY) + Math.sin(time * 0.4) * 0.15;
            leftRef.current.position.x = -3 + (1 - revealFactor) * 5;
        }

        if (rightRef.current) {
            const startY = -1.5;
            const endY = 0.0;
            rightRef.current.position.y = startY + revealFactor * (endY - startY) + Math.sin(time * 0.35 + 1) * 0.15;
            rightRef.current.position.x = 3 - (1 - revealFactor) * 5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 5, 0.3]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                BUILDING
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 4.2, 0.3]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Projects I have shipped
            </Text>

            {/* === PROJECTS PANEL (Left) === */}
            <group ref={leftRef} position={[-3, 0, 0]}>
                {/* Background card */}
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[6.5, 4.5]} />
                    <meshBasicMaterial color="#f5f0e8" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>

                <Text
                    position={[0, 1.4, 0.1]}
                    fontSize={0.5}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    MY PROJECTS
                </Text>

                {projects.map((p, i) => (
                    <Text
                        key={i}
                        position={[0, 0.5 - i * 0.75, 0.1]}
                        fontSize={0.4}
                        color="#2a2a2a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Regular.ttf"
                    >
                        {p.title}
                    </Text>
                ))}
            </group>

            {/* === OPEN SOURCE PANEL (Right) === */}
            {oss && (
                <group ref={rightRef} position={[3, 0, 0.5]}>
                    {/* Background card */}
                    <mesh position={[0, 0, -0.05]}>
                        <planeGeometry args={[6.5, 4.5]} />
                        <meshBasicMaterial color="#e8f0f5" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>

                    <Text
                        position={[0, 1.4, 0.1]}
                        fontSize={0.45}
                        color="#1a1a1a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        OPEN SOURCE
                    </Text>

                    <Text
                        position={[0, 0.75, 0.1]}
                        fontSize={0.38}
                        color="#2a2a2a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/RubikScribble-Regular.ttf"
                    >
                        {oss.title}
                    </Text>

                    <Text
                        position={[0, 0.25, 0.1]}
                        fontSize={0.28}
                        color="#555555"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Regular.ttf"
                    >
                        {oss.description}
                    </Text>

                    {/* Feature tags */}
                    {(oss.features || []).slice(0, 5).map((feat, i) => (
                        <Text
                            key={i}
                            position={[0, -0.25 - i * 0.42, 0.1]}
                            fontSize={0.26}
                            color="#444444"
                            anchorX="center"
                            anchorY="middle"
                            font="/fonts/CabinSketch-Regular.ttf"
                        >
                            • {feat}
                        </Text>
                    ))}
                </group>
            )}
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// FOCUS Milestone — Hackathon achievement (left) + Focus areas (right)
// Replaces old SkillsMilestone balloon cluster
// ─────────────────────────────────────────────────────────────────────────────
const FocusMilestone = ({ z, scrollProgressRef, achievements }) => {
    const groupRef = useRef();
    const achievementRef = useRef();
    const focusRef = useRef();

    // Safe defaults
    const achievement = achievements?.[0] || { title: 'Web Wizard 2.0', description: '1st Place' };

    const FOCUS_AREAS = [
        { label: 'Agentic AI', icon: '🤖' },
        { label: 'Full-Stack Development', icon: '⚡' },
        { label: 'Web3', icon: '🔗' },
    ];

    useFrame((state) => {
        if (!groupRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const time = state.clock.elapsedTime;
        const distanceZ = z + scrollProgress - 55;

        // === EDYTUJ TUTAJ (FOCUS REVEAL) ===
        const revealStart = -100;
        const revealEnd = -25;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 3); // ease out cubic
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        if (achievementRef.current) {
            const startY = -3;
            const endY = 0.5;
            achievementRef.current.position.y = startY + revealFactor * (endY - startY) + Math.sin(time * 0.5) * 0.15;
            achievementRef.current.position.x = -3 + (1 - revealFactor) * 6;
        }

        if (focusRef.current) {
            const startY = -2;
            const endY = 0;
            focusRef.current.position.y = startY + revealFactor * (endY - startY) + Math.sin(time * 0.4 + 1) * 0.12;
            focusRef.current.position.x = 3 - (1 - revealFactor) * 6;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 6, 0.5]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                ONWARD
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 5.2, 0.5]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Achievement & Focus
            </Text>

            {/* === ACHIEVEMENT CARD (Left) === */}
            <group ref={achievementRef} position={[-3, 0, 0]}>
                {/* Card background */}
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[5.5, 4]} />
                    <meshBasicMaterial color="#fdf6e3" transparent opacity={0.75} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>

                <Text
                    position={[0, 1.2, 0.1]}
                    fontSize={0.42}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    HACKATHON
                </Text>

                <Text
                    position={[0, 0.45, 0.1]}
                    fontSize={0.55}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/RubikScribble-Regular.ttf"
                >
                    {achievement.title}
                </Text>

                <Text
                    position={[0, -0.25, 0.1]}
                    fontSize={0.75}
                    color="#2a2a2a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    🏆
                </Text>

                <Text
                    position={[0, -0.95, 0.1]}
                    fontSize={0.45}
                    color="#333333"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    {achievement.description}
                </Text>
            </group>

            {/* === FOCUS AREAS PANEL (Right) === */}
            <group ref={focusRef} position={[3, 0, 0.3]}>
                {/* Card background */}
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[5.5, 4]} />
                    <meshBasicMaterial color="#e8f5e9" transparent opacity={0.75} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>

                <Text
                    position={[0, 1.2, 0.1]}
                    fontSize={0.42}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    FOCUS
                </Text>

                {FOCUS_AREAS.map((area, i) => (
                    <Text
                        key={i}
                        position={[0, 0.35 - i * 0.75, 0.1]}
                        fontSize={0.42}
                        color="#2a2a2a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Regular.ttf"
                    >
                        {area.icon} {area.label}
                    </Text>
                ))}
            </group>
        </group>
    );
};

// =========================================
// NOTE: Use this component inside the loop!
// =========================================

export default InfiniteSkyManager;
