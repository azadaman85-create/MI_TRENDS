/**
 * The logo as mail clients need it.
 *
 * Three constraints shape this: the src has to be absolute (there is no page to be
 * relative to), the dimensions have to be on the tag (Outlook ignores CSS sizing), and
 * the file is the flattened-on-white copy — transparency is uneven across clients, and
 * a dark-mode client would swallow transparent dark ink entirely.
 *
 * Images are also commonly blocked until the reader allows them, so the alt text has to
 * carry the brand on its own.
 */

const WIDTH = 168;
/** The artwork is 1200x262; Outlook needs the matching height spelled out. */
const HEIGHT = Math.round((WIDTH * 262) / 1200);

export function emailLogo(siteUrl: string): string {
  return `<img src="${siteUrl}/images/logo-email.png" width="${WIDTH}" height="${HEIGHT}" alt="MI TRENDS"
    style="display:block;border:0;outline:none;text-decoration:none;width:${WIDTH}px;height:${HEIGHT}px;" />`;
}
