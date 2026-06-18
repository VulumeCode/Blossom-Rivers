import { render } from 'preact';
import { FlowerRivers } from './flowerrivers';
import './style.css';

// flip-toolkit (react-flip-toolkit's engine) skips the ENTIRE animation when the
// OS "reduce motion" setting is on, so its onComplete never fires. Our game loop
// advances state inside Flipper's onComplete, so the app freezes. Force the
// reduced-motion media query to report false so animations + callbacks always run.
// Only this JS query is affected; CSS @media (prefers-reduced-motion) still works.
const _matchMedia = window.matchMedia.bind(window);
window.matchMedia = (query: string): MediaQueryList => {
    const mql = _matchMedia(query);
    if (!/prefers-reduced-motion/.test(query)) return mql;
    return new Proxy(mql, {
        get(target, prop) {
            if (prop === 'matches') return false;
            const value = Reflect.get(target, prop);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
};

render(<FlowerRivers />, document.getElementById('root')!);
