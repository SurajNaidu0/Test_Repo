// uniswapStyles.ts
// Reusable styles for Uniswap-like theme

export const uniswapStyles = {
    // Layout
    container: { minHeight: '100vh', backgroundColor: '#f9fafb' },
    mainContent: { maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' },

    // Navbar
    navbar: { backgroundColor: 'white', borderBottom: '1px solid #f3f4f6', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' },
    navbarInner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', height: '4rem' },
    logoContainer: { display: 'flex', alignItems: 'center' },
    logoText: { fontSize: '1.25rem', fontWeight: 'bold' },
    logoTextPurple: { color: '#8b5cf6' },
    logoTextPink: { color: '#ec4899' },
    navLinks: { display: 'flex', marginLeft: '2.5rem', gap: '2rem' },
    navLink: { display: 'inline-flex', alignItems: 'center', padding: '0 0.25rem', height: '100%', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' },
    activeNavLink: { borderBottom: '2px solid #8b5cf6', color: '#1f2937' },

    // Buttons
    buttonContainer: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    primaryButton: {
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: '#ec4899',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    secondaryButton: {
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: 'white',
        color: '#374151',
        border: '1px solid #d1d5db',
        cursor: 'pointer'
    },
    fullWidthButton: {
        display: 'inline-flex',
        width: '100%',
        justifyContent: 'center',
        padding: '0.75rem 1rem',
        marginTop: '1rem',
        borderRadius: '9999px',
        fontSize: '1rem',
        fontWeight: '500',
        backgroundColor: '#ec4899',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },

    // Typography
    heroSection: { textAlign: 'center', margin: '3rem 0' },
    heroTitle: { fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' },
    heroSubtitle: { fontSize: '1.25rem', color: '#4b5563', maxWidth: '36rem', margin: '0 auto' },

    // Cards
    cardContainer: { maxWidth: '28rem', margin: '0 auto', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '3rem' },
    cardPadding: { padding: '1.5rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    cardTitle: { fontSize: '1.125rem', fontWeight: '500', color: '#374151' },
    cardStatus: { color: '#ec4899' },

    // Poll Creation Box
    createPollBox: {
        margin: '1.5rem 0 0.5rem',
        padding: '1rem',
        border: '2px solid #ede9fe',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    createPollBoxTitle: { fontSize: '1.125rem', fontWeight: '500', color: '#111827' },
    createPollBoxSubtitle: { fontSize: '0.875rem', color: '#6b7280' },
    disabledCreatePollBox: {
        margin: '1.5rem 0 0.5rem',
        padding: '1rem',
        border: '2px solid #ede9fe',
        borderRadius: '0.5rem',
        backgroundColor: '#f9fafb'
    },
    disabledCreatePollBoxTitle: { fontSize: '1.125rem', fontWeight: '500', color: '#6b7280' },
    disabledCreatePollBoxSubtitle: { fontSize: '0.875rem', color: '#9ca3af' },

    // Poll Grid & Cards
    pollsSection: { maxWidth: '48rem', margin: '0 auto' },
    pollsSectionTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' },
    pollsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' },
    pollCard: {
        display: 'block',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6',
        transition: 'box-shadow 0.2s'
    },
    pollCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    pollCardTitle: { fontSize: '1.125rem', fontWeight: '500', color: '#1f2937' },
    pollCardFooter: { display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' },
    voteNowLink: { marginTop: '0.75rem', color: '#8b5cf6', fontSize: '0.875rem', display: 'flex', alignItems: 'center' },

    // Status Indicators
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
    },
    openBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
    closedBadge: { backgroundColor: '#f3f4f6', color: '#1f2937' },

    // Progress
    progressBarContainer: { width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.625rem', marginTop: '1rem' },
    progressBar: { backgroundColor: '#8b5cf6', height: '0.625rem', borderRadius: '9999px' },

    // Loading & States
    loadingContainer: { textAlign: 'center', padding: '3rem 0' },
    spinner: {
        display: 'inline-block',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        border: '4px solid #e5e7eb',
        borderTopColor: '#8b5cf6',
        animation: 'spin 1s linear infinite'
    },
    loadingText: { marginTop: '1rem', color: '#6b7280' },
    errorContainer: { textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' },
    errorText: { color: '#ef4444' },
    noPolls: { textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #f3f4f6' },
    noPollsText: { color: '#6b7280' },
    pollLink: { color: '#8b5cf6', textDecoration: 'none' },

    // Footer
    footer: { backgroundColor: 'white', borderTop: '1px solid #f3f4f6', padding: '2rem 0', marginTop: '3rem' },
    footerInner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { color: '#6b7280', fontSize: '0.875rem' },
    footerLinks: { display: 'flex', gap: '1.5rem' },
    footerLink: { color: '#9ca3af' },
    srOnly: { position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }
};

// Add a helper function to create the spinner animation
export const addSpinnerAnimation = () => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(styleTag);
    return () => {
        document.head.removeChild(styleTag);
    };
};

export default uniswapStyles;