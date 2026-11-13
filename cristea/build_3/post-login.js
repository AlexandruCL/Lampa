exports.onExecutePostLogin = async (event, api) => {
  const ns = "https://lampa.city";
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim(`${ns}/roles`, roles);
  api.accessToken.setCustomClaim(`${ns}/roles`, roles);
  // Silent refreshes in /curate must not ask for a second factor (Auth0's customize-mfa example).
  if (event.transaction?.protocol === "oauth2-refresh-token") return;
  if (roles.includes("curator") || roles.includes("admin")) {
    api.multifactor.enable("any", { allowRememberBrowser: false });
  }
};
