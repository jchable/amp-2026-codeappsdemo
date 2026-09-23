/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_USE_SHAREPOINT?: string; readonly VITE_SP_SITE_URL?: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
