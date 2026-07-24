import { signal } from "@preact/signals";

function getInitial() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("otwartekarty")) {
        return "otwarte";
    } else if (params.has("suisaiga")) {
        return "suisaiga";
    } else {
        return "louie";
    }
}

export type CardStyle = "otwarte"
    | "suisaiga"
    | "louie";

export const useCardStyle = signal<CardStyle>(getInitial());

export function setCardStyle(value: CardStyle) {
    useCardStyle.value = value;
}
