import type {
  CVEducation,
  CVExperience,
  CVOutputLanguage,
  CVSkill,
  NormalizedCVDraft,
} from './cvTypes';

type CVHtmlCopy = {
  lang: CVOutputLanguage;
  direction: 'rtl' | 'ltr';
  pageTitle: string;
  summaryTitle: string;
  experienceTitle: string;
  educationTitle: string;
  skillsTitle: string;
  experienceFallback: string;
  educationFallback: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  textAlign: 'right' | 'left';
  skillsPadding: string;
};

const ARABIC_COPY: CVHtmlCopy = {
  lang: 'ar',
  direction: 'rtl',
  pageTitle: 'السيرة الذاتية',
  summaryTitle: 'الملخص المهني',
  experienceTitle: 'الخبرات العملية',
  educationTitle: 'التعليم',
  skillsTitle: 'المهارات',
  experienceFallback: 'خبرة عملية',
  educationFallback: 'مؤهل تعليمي',
  primaryFontFamily: "'NotoKufiArabic-Bold', 'Noto Kufi Arabic', Arial, sans-serif",
  secondaryFontFamily: "'NotoKufiArabic-Regular', 'Noto Kufi Arabic', Arial, sans-serif",
  textAlign: 'right',
  skillsPadding: '0 18px 0 0',
};

const ENGLISH_COPY: CVHtmlCopy = {
  lang: 'en',
  direction: 'ltr',
  pageTitle: 'Resume',
  summaryTitle: 'Professional Summary',
  experienceTitle: 'Experience',
  educationTitle: 'Education',
  skillsTitle: 'Skills',
  experienceFallback: 'Professional Experience',
  educationFallback: 'Education',
  primaryFontFamily: "'Helvetica Neue', Arial, sans-serif",
  secondaryFontFamily: "'Helvetica Neue', Arial, sans-serif",
  textAlign: 'left',
  skillsPadding: '0 0 0 18px',
};

function getCopy(outputLanguage: CVOutputLanguage): CVHtmlCopy {
  return outputLanguage === 'en' ? ENGLISH_COPY : ARABIC_COPY;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderExperience(exp: CVExperience, copy: CVHtmlCopy): string {
  const metaParts = [exp.organization, exp.duration].filter(Boolean).map(escapeHtml);

  return `
    <article class="entry">
      <h3>${escapeHtml(exp.title || exp.organization || copy.experienceFallback)}</h3>
      ${metaParts.length ? `<p class="meta">${metaParts.join(' | ')}</p>` : ''}
      ${exp.description ? `<p class="body-text">${escapeHtml(exp.description)}</p>` : ''}
    </article>
  `;
}

function renderEducation(education: CVEducation, copy: CVHtmlCopy): string {
  const metaParts = [education.institution, education.year].filter(Boolean).map(escapeHtml);

  return `
    <article class="entry">
      <h3>${escapeHtml(education.degree || education.institution || copy.educationFallback)}</h3>
      ${metaParts.length ? `<p class="meta">${metaParts.join(' | ')}</p>` : ''}
    </article>
  `;
}

function renderSkill(skill: CVSkill): string {
  return `<li>${escapeHtml(skill.value)}</li>`;
}

function renderSection(title: string, body: string): string {
  return `
    <section class="section">
      <h2>${title}</h2>
      ${body}
    </section>
  `;
}

export function renderCVHtml(draft: NormalizedCVDraft, outputLanguage: CVOutputLanguage = 'ar'): string {
  const copy = getCopy(outputLanguage);
  const sections: string[] = [];

  if (draft.summary) {
    sections.push(renderSection(copy.summaryTitle, `<p class="body-text">${escapeHtml(draft.summary)}</p>`));
  }

  if (draft.experiences.length) {
    sections.push(renderSection(copy.experienceTitle, draft.experiences.map(experience => renderExperience(experience, copy)).join('')));
  }

  if (draft.education.length) {
    sections.push(renderSection(copy.educationTitle, draft.education.map(item => renderEducation(item, copy)).join('')));
  }

  if (draft.skills.length) {
    sections.push(renderSection(copy.skillsTitle, `<ul class="skills-list">${draft.skills.map(renderSkill).join('')}</ul>`));
  }

  return `
    <!DOCTYPE html>
    <html lang="${copy.lang}" dir="${copy.direction}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(draft.fullName)} | ${copy.pageTitle}</title>
        <style>
          @page {
            margin: 20mm 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #1c1c1c;
            background: #ffffff;
            direction: ${copy.direction};
            text-align: ${copy.textAlign};
            line-height: 1.8;
            font-family: ${copy.secondaryFontFamily};
          }

          .page {
            padding: 0;
          }

          .header {
            margin-bottom: 22px;
            padding-bottom: 12px;
            border-bottom: 2px solid #cbae82;
          }

          .header h1 {
            margin: 0;
            color: #0c2a20;
            font-size: 26px;
            font-family: ${copy.primaryFontFamily};
          }

          .section {
            margin-bottom: 18px;
          }

          .section h2 {
            margin: 0 0 10px;
            color: #0c2a20;
            font-size: 17px;
            font-family: ${copy.primaryFontFamily};
          }

          .entry {
            margin-bottom: 12px;
          }

          .entry h3 {
            margin: 0 0 4px;
            color: #1f2933;
            font-size: 14px;
            font-family: ${copy.primaryFontFamily};
          }

          .meta {
            margin: 0 0 4px;
            color: #52606d;
            font-size: 12px;
          }

          .body-text {
            margin: 0;
            font-size: 13px;
            white-space: pre-wrap;
          }

          .skills-list {
            margin: 0;
            padding: ${copy.skillsPadding};
          }

          .skills-list li {
            margin-bottom: 6px;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <h1>${escapeHtml(draft.fullName)}</h1>
          </header>
          ${sections.join('')}
        </main>
      </body>
    </html>
  `;
}

export function renderArabicCVHtml(draft: NormalizedCVDraft): string {
  return renderCVHtml(draft, 'ar');
}

export function renderEnglishCVHtml(draft: NormalizedCVDraft): string {
  return renderCVHtml(draft, 'en');
}
