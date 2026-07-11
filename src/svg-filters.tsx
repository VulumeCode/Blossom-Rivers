export function SvgFilters() {
    return (
        <svg
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
            }}
        >
            <defs>
                <filter id="tint-glow" color-interpolation-filters="sRGB">
                    <feFlood
                        flood-color="var(--color-pink)"
                        flood-opacity="0.3"
                        result="flood"
                    />
                    <feBlend in="flood" in2="SourceGraphic" mode="screen" />
                </filter>
                <filter id="tint-highlight" color-interpolation-filters="sRGB">
                    <feFlood
                        flood-color="var(--color-capture)"
                        flood-opacity="0.3"
                        result="flood"
                    />
                    <feBlend in="flood" in2="SourceGraphic" mode="screen" />
                </filter>
            </defs>
        </svg>
    );
}
