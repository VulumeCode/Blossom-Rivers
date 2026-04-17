/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

import 'preact';

declare module 'preact' {
    namespace JSX {
        interface IntrinsicElements {
            'card-view': HTMLAttributes<HTMLElement>;
            'river-lane': HTMLAttributes<HTMLElement>;
            'river-icon': HTMLAttributes<HTMLElement>;
            'river-spacer': HTMLAttributes<HTMLElement>;
            'hand-view': HTMLAttributes<HTMLElement>;
            'captured-view': HTMLAttributes<HTMLElement>;
            'captured-group': HTMLAttributes<HTMLElement>;
            'captured-label': HTMLAttributes<HTMLElement>;
            'group-count': HTMLAttributes<HTMLElement>;
            'yaku-list': HTMLAttributes<HTMLElement>;
            'yaku-label': HTMLAttributes<HTMLElement>;
            'yaku-total': HTMLAttributes<HTMLElement>;
            'koikoi-indicator': HTMLAttributes<HTMLElement>;
            'top-title': HTMLAttributes<HTMLElement>;
            'draw-multiplier': HTMLAttributes<HTMLElement>;
            'deck-label': HTMLAttributes<HTMLElement>;
        }
    }
}
