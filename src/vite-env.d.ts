/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Opcional — só configurada em ambientes que exigem o contrato X-Service-Token (ver #18). */
  readonly VITE_SERVICE_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
