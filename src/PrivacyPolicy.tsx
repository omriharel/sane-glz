export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy" dir="ltr">
      <h2>Privacy Policy for Sane GLZ</h2>

      <p>
        Sane GLZ (glz.omri.io) is a small hobby project and an unofficial alternative interface for listening to GLZ
        (Galei Tzahal) programs. It is not affiliated with GLZ.
      </p>

      <h3>What we store</h3>
      <p>
        There are no accounts. The programs you choose, how many days back to show, and your listening progress are
        stored only in your own browser (localStorage). They never leave your device, and you can delete them at any
        time from the settings page or by clearing your browser data.
      </p>

      <h3>Third parties</h3>
      <p>
        Program listings and audio are loaded directly from Omny Studio, the podcast platform GLZ publishes its programs
        on, so Omny receives the usual request information (such as your IP address and browser type) when you browse or
        listen. Their handling of that information is covered by their own privacy policy. Icons are loaded from Google
        Fonts. The site itself is hosted on Amazon Web Services (S3 and CloudFront).
      </p>

      <p>We don't use cookies, analytics, or advertising.</p>
    </div>
  )
}
