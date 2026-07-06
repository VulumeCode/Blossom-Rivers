import { signal } from "@preact/signals";

function getInitial(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has("otwartekarty");
}

export const useOtwarteKarty = signal<boolean>(getInitial());

export function setOtwarteKarty(value: boolean) {
    useOtwarteKarty.value = value;
}
