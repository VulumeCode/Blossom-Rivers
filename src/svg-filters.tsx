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
                <filter
                    id="inner-shadow"
                    color-interpolation-filters="sRGB"
                    primitiveUnits="objectBoundingBox"
                >
                    <feFlood flood-color="#610000" />
                    <feComposite operator="out" in2="SourceGraphic" />
                    <feMorphology operator="dilate" radius="0.035" />
                    <feGaussianBlur stdDeviation="0.005" />
                    <feBlend mode="darken" in2="SourceGraphic" />
                </filter>
            </defs>
        </svg>
    );
}
