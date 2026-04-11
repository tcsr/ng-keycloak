
/**
 * AUTHORITY VAULT - CENTRAL ACL CONFIGURATION
 * All role-to-module mappings should be managed here.
 */

export const ACL_ROLES = {
  VAULT_ADMIN: 'vault_admin',
  SALES: 'sales_team',
  CREATIVE: 'creative_team',
  CLINICAL: 'clinical_team',
  DEFAULT: 'default-roles-authority-vault',
  OFFLINE: 'offline_access'
};

export const MODULE_PERMISSIONS: Record<string, string[]> = {
  Dashboard: [
    ACL_ROLES.VAULT_ADMIN, 
    ACL_ROLES.SALES, 
    ACL_ROLES.CREATIVE, 
    ACL_ROLES.CLINICAL, 
    ACL_ROLES.DEFAULT, 
    ACL_ROLES.OFFLINE
  ],
  Identities: [ACL_ROLES.VAULT_ADMIN],
  Analytics: [
    ACL_ROLES.VAULT_ADMIN, 
    ACL_ROLES.SALES, 
    ACL_ROLES.CREATIVE
  ],
  Governance: [ACL_ROLES.VAULT_ADMIN]
};

/**
 * Registry Sync Strategy:
 * Only these roles trigger the getUsers/getRoles handshakes.
 */
export const REGISTRY_SYNC_ROLES = [ACL_ROLES.VAULT_ADMIN];
