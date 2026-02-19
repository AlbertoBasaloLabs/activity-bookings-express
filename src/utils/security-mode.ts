import { SecurityMode } from '../types/auth';

export const SECURITY_MODE_ENV = 'SECURITY_MODE';
export const SECURED_SECURITY_MODE: SecurityMode = 'secured';
export const OPEN_SECURITY_MODE: SecurityMode = 'open';

let cachedSecurityMode: SecurityMode | undefined;

export function resolveSecurityMode(mode: string | undefined): SecurityMode {
  if (!mode || mode.trim() === '') {
    return SECURED_SECURITY_MODE;
  }

  const normalizedMode = mode.trim().toLowerCase();
  if (normalizedMode === SECURED_SECURITY_MODE || normalizedMode === OPEN_SECURITY_MODE) {
    return normalizedMode;
  }

  throw new Error(
    `Invalid ${SECURITY_MODE_ENV} value: "${mode}". Allowed values are "${SECURED_SECURITY_MODE}" or "${OPEN_SECURITY_MODE}".`
  );
}

export function getSecurityMode(): SecurityMode {
  if (cachedSecurityMode) {
    return cachedSecurityMode;
  }

  cachedSecurityMode = resolveSecurityMode(process.env[SECURITY_MODE_ENV]);
  return cachedSecurityMode;
}

export function resetSecurityModeCache(): void {
  cachedSecurityMode = undefined;
}
