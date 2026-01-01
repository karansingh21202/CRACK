import React, { forwardRef } from 'react';
import { FaCrown, FaSkull, FaFire, FaBolt, FaCheck, FaUsers } from 'react-icons/fa';

interface BRShareImageProps {
    placement: number;
    totalPlayers: number;
    isWinner: boolean;
    playerName: string;
    stats: {
        roundsSurvived: number;
        totalRounds: number;
        codesGuessed: number;
        totalGuesses: number;
        gameDuration: number;
    };
}

export const BRShareImage = forwardRef<HTMLDivElement, BRShareImageProps>(({
    placement,
    totalPlayers,
    isWinner,
    playerName,
    stats
}, ref) => {

    const getOrdinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const betterThanPercentage = Math.round(((totalPlayers - placement) / totalPlayers) * 100);

    return (
        <div
            ref={ref}
            style={{
                width: '600px',
                height: '800px',
                background: isWinner
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)'
                    : 'linear-gradient(135deg, #1a1a1a 0%, #0f1a1a 50%, #0a0f0f 100%)',
                color: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* Background Glow Effects */}
            {isWinner ? (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        left: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                </>
            ) : (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        left: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />
                </>
            )}

            {/* Grid Pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
            }} />

            {/* Dot Pattern - Top Right */}
            <div style={{ position: 'absolute', top: '60px', right: '40px', display: 'flex', gap: '8px', opacity: 0.3 }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isWinner ? '#fbbf24' : '#10b981',
                    }} />
                ))}
            </div>

            {/* Dot Pattern - Bottom Left */}
            <div style={{ position: 'absolute', bottom: '80px', left: '40px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.3 }}>
                {[...Array(3)].map((_, row) => (
                    <div key={row} style={{ display: 'flex', gap: '8px' }}>
                        {[...Array(3)].map((_, col) => (
                            <div key={col} style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: isWinner ? '#fbbf24' : '#10b981',
                            }} />
                        ))}
                    </div>
                ))}
            </div>

            {/* Corner Accent Lines - Top Left */}
            <div style={{
                position: 'absolute',
                top: '30px',
                left: '30px',
                width: '60px',
                height: '60px',
                borderTop: `2px solid ${isWinner ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderLeft: `2px solid ${isWinner ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }} />

            {/* Corner Accent Lines - Bottom Right */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                right: '30px',
                width: '60px',
                height: '60px',
                borderBottom: `2px solid ${isWinner ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderRight: `2px solid ${isWinner ? 'rgba(251,191,36,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                position: 'relative',
                zIndex: 10,
            }}>
                <div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '-1px',
                        margin: 0,
                        background: 'linear-gradient(90deg, #10b981, #14b8a6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        COLOR KNOCKOUT
                    </h1>
                    <p style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                        margin: '4px 0 0',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                    }}>
                        Battle Royale
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <FaUsers size={16} color="rgba(255,255,255,0.6)" />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{totalPlayers} Players</span>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Icon */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    background: isWinner
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
                    boxShadow: isWinner
                        ? '0 0 60px rgba(251,191,36,0.5)'
                        : '0 0 40px rgba(75,85,99,0.3)',
                }}>
                    {isWinner ? (
                        <FaCrown size={56} color="white" />
                    ) : (
                        <FaSkull size={48} color="#ef4444" />
                    )}
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    margin: '0 0 8px',
                    letterSpacing: '-2px',
                    background: isWinner
                        ? 'linear-gradient(90deg, #fde68a, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #ffffff, #d1d5db)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    {isWinner ? 'CHAMPION!' : 'KNOCKED OUT'}
                </h2>

                {/* Player Name */}
                <p style={{
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 24px',
                }}>
                    {playerName}
                </p>

                {/* Placement */}
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    marginBottom: '40px',
                }}>
                    <span style={{
                        fontSize: '72px',
                        fontWeight: 900,
                        color: isWinner ? '#fbbf24' : '#10b981',
                    }}>
                        {getOrdinal(placement)}
                    </span>
                    <span style={{
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.5)',
                    }}>
                        of {totalPlayers}
                    </span>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    width: '100%',
                    maxWidth: '400px',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                        }}>
                            <FaFire size={14} color="#f97316" />
                            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats.roundsSurvived}</span>
                        </div>
                        <div style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            Rounds
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                        }}>
                            <FaBolt size={14} color="#a855f7" />
                            <span style={{ fontSize: '28px', fontWeight: 900 }}>{stats.totalGuesses}</span>
                        </div>
                        <div style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            Guesses
                        </div>
                    </div>

                    <div style={{
                        background: isWinner ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        border: isWinner ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '20px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                        }}>
                            <FaCheck size={14} color="#10b981" />
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>{stats.codesGuessed}</span>
                        </div>
                        <div style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            Cracked
                        </div>
                    </div>
                </div>

                {/* Performance Bar */}
                <div style={{ width: '100%', maxWidth: '400px', marginTop: '32px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.4)',
                        marginBottom: '8px',
                    }}>
                        <span>Performance</span>
                        <span>Top {100 - betterThanPercentage}%</span>
                    </div>
                    <div style={{
                        height: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${betterThanPercentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #14b8a6)',
                            borderRadius: '4px',
                        }} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                }}>
                    ⏱️ {formatTime(stats.gameDuration)} • {new Date().toLocaleDateString()}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 900,
                        letterSpacing: '-0.5px',
                    }}>
                        crack-pi-ruddy.vercel.app
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: '#10b981',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}>
                        Play Now
                    </div>
                </div>
            </div>
        </div>
    );
});

BRShareImage.displayName = 'BRShareImage';
