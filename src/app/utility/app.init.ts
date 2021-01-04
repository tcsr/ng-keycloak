import { KeycloakService } from 'keycloak-angular';
import { promise } from 'protractor';

export function initializeKeycloak(
  keycloak: KeycloakService
): () => Promise<boolean> {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080/auth',
        realm: 'angular-web',
        clientId: 'angular-web-client',
      },
      initOptions: {
        checkLoginIframe: true,
        checkLoginIframeInterval: 60,
      },
      loadUserProfileAtStartUp: true,
    });
}
