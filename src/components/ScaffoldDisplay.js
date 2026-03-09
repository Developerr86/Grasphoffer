import React from 'react';

/**
 * Renders a keyword memory scaffold string in a visual chain layout.
 *
 * Expected plain-text format (produced by the LLM with strict rules):
 *   Topic Title          ← first non-empty line with no " → "
 *
 *   Chain → Keyword → Keyword + Keyword → Outcome
 *     → SubTopic → Keyword              ← indented with 2+ spaces or tab
 *
 * Defensively strips any stray markdown headers, horizontal rules,
 * bullets, or numbered list prefixes the LLM may still produce.
 */

const STRIP_LEADING = /^([#*\-_]+\s*|(\d+)\.\s+)/; // strips ##, -, 1. etc.
const HORIZ_RULE = /^[-_*]{3,}$/;                // --- *** ___

const ScaffoldDisplay = ({ scaffold }) => {
    if (!scaffold) return null;

    const lines = scaffold
        .split('\n')
        .map((l) => l.trimEnd())
        // Drop horizontal rules and blank lines used as section separators
        .filter((l) => l.trim().length > 0 && !HORIZ_RULE.test(l.trim()));

    // Identify the title: first non-empty line (usually has no " → ")
    let titleFound = false;

    const rendered = lines.map((rawLine, li) => {
        // Strip any residual markdown heading or bullet syntax
        const line = rawLine.replace(STRIP_LEADING, '').trimStart();

        if (!line) return null;

        // Detect indentation (2+ leading spaces or a tab in the raw line)
        const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');
        const hasArrow = line.includes(' → ');

        // The very first non-empty line is always the topic title
        if (!titleFound && !isIndented) {
            titleFound = true;
            return (
                <div key={li} className="scaffold-section-title">
                    {line.replace(/^→\s*/, '')}
                </div>
            );
        }

        // Lines with no arrow and no indentation after the title = sub-section label
        if (!hasArrow && !isIndented) {
            return (
                <div key={li} className="scaffold-section-title scaffold-section-title--sub">
                    {line.replace(/^→\s*/, '')}
                </div>
            );
        }

        // Arrow chain (main or indented)
        const content = line.replace(/^→\s*/, '');   // strip leading "→ " if present
        const parts = content.split(' → ');

        return (
            <div
                key={li}
                className={`scaffold-chain ${isIndented ? 'scaffold-chain--indented' : ''}`}
            >
                {isIndented && <span className="scaffold-indent-arrow">↳</span>}
                {parts.map((keyword, ki) => {
                    const subs = keyword.split(' + ').map((s) => s.trim()).filter(Boolean);
                    return (
                        <React.Fragment key={ki}>
                            {ki > 0 && <span className="scaffold-arrow">→</span>}
                            <span className="scaffold-node">
                                {subs.map((sub, si) => (
                                    <React.Fragment key={si}>
                                        {si > 0 && <span className="scaffold-plus">+</span>}
                                        <span className="scaffold-keyword">{sub}</span>
                                    </React.Fragment>
                                ))}
                            </span>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    });

    return <div className="scaffold-root">{rendered}</div>;
};

export default ScaffoldDisplay;
