import type { DocComposant } from "../doc-types";

const modules = import.meta.glob<DocComposant>("../composants/*/*.doc.tsx", { import: "default", eager: true });

export const DOCS_COMPOSANTS: DocComposant[] = Object.values(modules).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
