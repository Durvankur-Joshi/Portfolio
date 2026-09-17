import { useScene } from '../../context/SceneContext';
import { useGalleryProjects, useStudioContent, useAwards, useAboutProfile, useContactProfile } from '../../hooks/useSanityData';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — A7 Accessibility
 * 
 * Invisible HTML layer providing screen reader access to 3D canvas content.
 * Contains buttons/links matching interactive 3D elements (doors, rooms).
 * Visually hidden via .sr-only but fully accessible to assistive tech.
 */
const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();

    // Pobieranie danych do wygenerowania niewidocznego HTML-a dla SEO / robotów
    const projects = useGalleryProjects();
    const studio = useStudioContent();
    const awards = useAwards();
    const aboutProfile = useAboutProfile();
    const contactProfile = useContactProfile();

    return (
        <div className="sr-overlay" role="complementary" aria-label="Accessible navigation for 3D portfolio">
            {/* Skip to content link */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                Skip to accessible navigation
            </a>

            {/* Main accessible navigation */}
            <nav id="sr-main-nav" className="sr-only" aria-label="Portfolio rooms">
                <h1>DURVANKUR — Software Dev</h1>
                <h2>Portfolio Navigation</h2>

                {!hasEntered && (
                    <p>Welcome to DURVANKUR's interactive 3D portfolio. Click or press Enter on the doors to enter.</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>You are in the corridor. Choose a room to explore:</p>
                        <ul>
                            <li>
                                <button onClick={() => teleportTo('about')} type="button">
                                    About — My story, skills, and journey
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('gallery')} type="button">
                                    The Gallery — My projects and work
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('contact')} type="button">
                                    Contact — Get in touch with me
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('studio')} type="button">
                                    The Studio — Technologies and experience
                                </button>
                            </li>
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>
                            You are in the {currentRoom === 'about' ? 'About' :
                                currentRoom === 'gallery' ? 'Gallery' :
                                    currentRoom === 'contact' ? 'Contact' :
                                        currentRoom === 'studio' ? 'Studio' : currentRoom} room.
                        </p>
                        <button onClick={requestExit} type="button">
                            Go back to corridor
                        </button>

                        {/* Room-specific content descriptions */}
                        {currentRoom === 'about' && (
                            <div aria-label="About room content">
                                <h3>About {aboutProfile?.name || 'Durvankur Joshi'}</h3>
                                {aboutProfile?.bio && <p>{aboutProfile.bio}</p>}

                                {/* Education */}
                                {aboutProfile?.education && aboutProfile.education.length > 0 && (
                                    <section>
                                        <h4>Education</h4>
                                        <ul>
                                            {aboutProfile.education.map((edu, i) => (
                                                <li key={i}>
                                                    <strong>{edu.degree}</strong> — {edu.institution}
                                                    {edu.score && ` (${edu.score})`}
                                                    {edu.period && `, ${edu.period}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Journey Highlights / Projects */}
                                {aboutProfile?.highlights && aboutProfile.highlights.length > 0 && (
                                    <section>
                                        <h4>Projects</h4>
                                        <ul>
                                            {aboutProfile.highlights.filter(h => h.type === 'project').map((h, i) => (
                                                <li key={i}><strong>{h.title}</strong>{h.description && ` — ${h.description}`}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Open Source */}
                                {aboutProfile?.openSource && aboutProfile.openSource.length > 0 && (
                                    <section>
                                        <h4>Open Source</h4>
                                        <ul>
                                            {aboutProfile.openSource.map((oss, i) => (
                                                <li key={i}>
                                                    <strong>{oss.title}</strong>{oss.description && ` — ${oss.description}`}
                                                    {oss.features && oss.features.length > 0 && (
                                                        <ul>{oss.features.map((f, fi) => <li key={fi}>{f}</li>)}</ul>
                                                    )}
                                                    {oss.url && <a href={oss.url}>View contribution</a>}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Achievements */}
                                {aboutProfile?.achievements && aboutProfile.achievements.length > 0 && (
                                    <section>
                                        <h4>Achievements</h4>
                                        <ul>
                                            {aboutProfile.achievements.map((a, i) => (
                                                <li key={i}>
                                                    <strong>{a.title}</strong>{a.description && ` — ${a.description}`}
                                                    {a.url && <a href={a.url}>View</a>}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Awards from awardCertificate Sanity schema */}
                                {awards && (
                                    <section>
                                        <h4>Awards</h4>
                                        <ul>
                                            {awards.sotd && awards.sotd.items && awards.sotd.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>View</a>}</li>
                                            ))}
                                            {awards.sotm && awards.sotm.items && awards.sotm.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>View</a>}</li>
                                            ))}
                                            {awards.other && awards.other.items && awards.other.items.map((a, i) => (
                                                <li key={i}>{a.label} - {a.date} {a.url && <a href={a.url}>View</a>}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        )}
                        {currentRoom === 'gallery' && (
                            <div aria-label="Gallery room content">
                                <h3>My Projects</h3>
                                <p>Browse through my portfolio projects displayed on paper cards. Click on a project card to see details and visit the live site.</p>

                                {projects && projects.length > 0 && (
                                    <ul>
                                        {projects.map((p, i) => (
                                            <li key={i}>
                                                <h4>{p.title}</h4>
                                                <p>{p.description}</p>
                                                {p.url && <a href={p.url}>Visit {p.title}</a>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {currentRoom === 'contact' && (
                            <div aria-label="Contact room content">
                                <h3>Contact Durvankur Joshi</h3>
                                <p>
                                    An interactive 3D harbour scene. Floating barrels are clickable contact actions.
                                    {contactProfile?.location && ` Located in ${contactProfile.location}.`}
                                    {contactProfile?.availabilityText && ` ${contactProfile.availabilityText}.`}
                                </p>
                                <ul>
                                    {contactProfile?.githubUrl && (
                                        <li>
                                            <strong>GitHub</strong>:{' '}
                                            <a href={contactProfile.githubUrl} target="_blank" rel="noopener noreferrer">
                                                {contactProfile.githubUrl}
                                            </a>
                                        </li>
                                    )}
                                    {contactProfile?.linkedinUrl && (
                                        <li>
                                            <strong>LinkedIn</strong>:{' '}
                                            <a href={contactProfile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                                {contactProfile.linkedinUrl}
                                            </a>
                                        </li>
                                    )}
                                    {contactProfile?.email && (
                                        <li>
                                            <strong>Email</strong>:{' '}
                                            <a href={`mailto:${contactProfile.email}`}>
                                                {contactProfile.email}
                                            </a>
                                        </li>
                                    )}
                                    {contactProfile?.phone && (
                                        <li>
                                            <strong>Phone</strong>:{' '}
                                            <a href={`tel:${contactProfile.phone.replace(/\s/g, '')}`}>
                                                {contactProfile.phone}
                                            </a>
                                        </li>
                                    )}
                                    {contactProfile?.resumeUrl && (
                                        <li>
                                            <strong>Resume / CV</strong>:{' '}
                                            <a href={contactProfile.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                View Resume
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                        {currentRoom === 'studio' && (
                            <div aria-label="Studio room content">
                                <h3>The Studio</h3>
                                <p>Explore my experience and skills on rotating monitors. Click a monitor to read detailed information about my work.</p>

                                {studio && studio.length > 0 && (
                                    <ul>
                                        {studio.map((s, i) => (
                                            <li key={i}>
                                                <h4>{s.title} ({s.platform})</h4>
                                                <p>{s.description}</p>
                                                {s.url && <a href={s.url}>View content</a>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Quick navigation to other rooms */}
                        <h3>Quick Navigation</h3>
                        <ul>
                            {currentRoom !== 'about' && (
                                <li><button onClick={() => teleportTo('about')} type="button">Go to About</button></li>
                            )}
                            {currentRoom !== 'gallery' && (
                                <li><button onClick={() => teleportTo('gallery')} type="button">Go to Gallery</button></li>
                            )}
                            {currentRoom !== 'contact' && (
                                <li><button onClick={() => teleportTo('contact')} type="button">Go to Contact</button></li>
                            )}
                            {currentRoom !== 'studio' && (
                                <li><button onClick={() => teleportTo('studio')} type="button">Go to Studio</button></li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* Live region for state changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom && `Entered ${currentRoom} room`}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;
