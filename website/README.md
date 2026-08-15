# SnoozePulse public site

Static pages for App Store and Play Store review. No build step.

| Page | URL after Pages is enabled |
| --- | --- |
| Home | https://jobinmathewp.github.io/SnoozePulse/ |
| Privacy Policy | https://jobinmathewp.github.io/SnoozePulse/privacy/ |
| Support | https://jobinmathewp.github.io/SnoozePulse/support/ |
| Terms of Use | https://jobinmathewp.github.io/SnoozePulse/terms/ |

Paste the Privacy and Support URLs into App Store Connect. Home is the optional Marketing URL.

## Enable GitHub Pages (once)

1. Merge this folder to `main`.
2. In the GitHub repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and run **Deploy site**, or push a change under `website/`.
5. Wait for the workflow to finish, then open the Privacy URL in a private window.

The first run creates a `github-pages` environment. If the job waits for approval, open that environment and approve it.

## Preview locally

```bash
npx --yes serve website
```

Open the printed local URL. Links are relative, so Privacy and Support work without GitHub.

## Add a contact email later

Replace the GitHub Issues links in `privacy/index.html`, `support/index.html`, and `terms/index.html` with a `mailto:` address you actually read. Keep Issues as a secondary option if you want.

## Custom domain later

In **Settings → Pages**, add the domain. Then add a `website/CNAME` file containing only that hostname (for example `snoozepulse.app`) and update the canonical / Open Graph URLs in each HTML file plus `robots.txt` and `sitemap.xml`.
