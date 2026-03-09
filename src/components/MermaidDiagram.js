import React, { useEffect, useRef, useState } from 'react';

/**
 * Renders a Mermaid diagram from a code string.
 * Falls back to a styled raw code block if rendering fails.
 */
const MermaidDiagram = ({ code }) => {
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (!code) return;

        let cancelled = false;

        const render = async () => {
            try {
                // Lazy-load mermaid so it doesn't bloat the initial bundle
                const mermaid = (await import('mermaid')).default;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                    securityLevel: 'loose',
                    // Keep diagrams simple / compact
                    flowchart: { useMaxWidth: true, htmlLabels: true },
                    sequence: { useMaxWidth: true },
                });

                // Unique ID required by Mermaid
                const id = `mermaid-${Math.random().toString(36).slice(2)}`;
                const { svg: rendered } = await mermaid.render(id, code.trim());

                if (!cancelled) {
                    setSvg(rendered);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn('Mermaid render error:', err.message);
                    setError(err.message);
                }
            }
        };

        render();
        return () => { cancelled = true; };
    }, [code]);

    if (error) {
        return (
            <div className="mermaid-error">
                <p className="mermaid-error-label">⚠ Diagram could not render — showing source:</p>
                <pre className="mermaid-raw"><code>{code}</code></pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="mermaid-loading">
                <div className="mermaid-spinner" />
                <span>Rendering diagram…</span>
            </div>
        );
    }

    return (
        <div
            className="mermaid-container"
            ref={containerRef}
            // Mermaid returns sanitized SVG — safe to inject
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidDiagram;
