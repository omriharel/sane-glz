export const baseApiUrl = 'https://qbl6dnzy8d.execute-api.eu-central-1.amazonaws.com';

const baseAuthUrl = 'https://saneglz.auth.eu-central-1.amazoncognito.com';
const authClientId = '7jhimht7pc5b3c14g350q78tj0';
const authRedirect = 'https://glz.omri.io/';
const authLogoutRedirect = 'https://glz.omri.io/logout';

export const authLoginPageUrl = `${baseAuthUrl}/login?client_id=${authClientId}&response_type=token&redirect_uri=${authRedirect}`;
export const authLogoutPageUrl = `${baseAuthUrl}/logout?client_id=${authClientId}&logout_uri=${authLogoutRedirect}`;
