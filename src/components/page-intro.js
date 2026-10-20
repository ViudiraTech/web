export function pageIntro({ eyebrow, title, copy = '' }) {
  return `<section class="page-intro"><div class="container">
    <div class="page-intro__inner reveal">
      <p class="kicker">${eyebrow}</p>
      <h1>${title}</h1>
      ${copy ? `<p class="page-intro__copy">${copy}</p>` : ''}
    </div>
  </div></section>`;
}
