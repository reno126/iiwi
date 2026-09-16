import { AUTH_ERRORS, AUTH_ERROR_MESSAGES } from "./constants";

export function getAuthErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case AUTH_ERRORS.oauthAccountNotLinked:
      return AUTH_ERROR_MESSAGES.oauthAccountNotLinked;
    case AUTH_ERRORS.oauthAccountOnly:
      return AUTH_ERROR_MESSAGES.oauthAccountOnly;
    case AUTH_ERRORS.oauthSignin:
    case AUTH_ERRORS.oauthCallback:
    case AUTH_ERRORS.oauthCreateAccount:
      return AUTH_ERROR_MESSAGES.oauthGeneralError;
    case AUTH_ERRORS.credentialsSignin:
      return AUTH_ERROR_MESSAGES.credentialsSignin;
    case AUTH_ERRORS.sessionRequired:
      return AUTH_ERROR_MESSAGES.sessionRequired;
    default:
      return errorCode ? AUTH_ERROR_MESSAGES.defaultError : "";
  }
}
