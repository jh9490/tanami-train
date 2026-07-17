import type {
  CVCertification,
  CVContactSection,
  CVEducation,
  CVExperience,
  CVOutputLanguage,
  CVSkill,
  CVVolunteerExperience,
  NormalizedCVDraft,
} from './cvTypes';

type CVHtmlCopy = {
  lang: CVOutputLanguage;
  direction: 'rtl' | 'ltr';
  pageTitle: string;
  summaryTitle: string;
  contactTitle: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
  linkedinLabel: string;
  experienceTitle: string;
  educationTitle: string;
  skillsTitle: string;
  certificationsTitle: string;
  volunteerExperienceTitle: string;
  experienceFallback: string;
  educationFallback: string;
  certificationFallback: string;
  volunteerFallback: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  textAlign: 'right' | 'left';
  listSeparator: string;
};

const ARABIC_COPY: CVHtmlCopy = {
  lang: 'ar',
  direction: 'rtl',
  pageTitle: 'السيرة الذاتية',
  summaryTitle: 'الملخص المهني',
  contactTitle: 'معلومات التواصل',
  emailLabel: 'البريد الإلكتروني',
  phoneLabel: 'الجوال',
  addressLabel: 'العنوان',
  linkedinLabel: 'LinkedIn',
  experienceTitle: 'الخبرات العملية',
  educationTitle: 'التعليم',
  skillsTitle: 'المهارات',
  certificationsTitle: 'الشهادات والدورات',
  volunteerExperienceTitle: 'الخبرة التطوعية',
  experienceFallback: 'خبرة عملية',
  educationFallback: 'مؤهل تعليمي',
  certificationFallback: 'شهادة أو دورة',
  volunteerFallback: 'خبرة تطوعية',
  primaryFontFamily: "'NotoKufiArabic-Bold', 'Noto Kufi Arabic', Arial, sans-serif",
  secondaryFontFamily: "'NotoKufiArabic-Regular', 'Noto Kufi Arabic', Arial, sans-serif",
  textAlign: 'right',
  listSeparator: '، ',
};

const ENGLISH_COPY: CVHtmlCopy = {
  lang: 'en',
  direction: 'ltr',
  pageTitle: 'Resume',
  summaryTitle: 'Objective',
  contactTitle: 'Contact',
  emailLabel: 'Email',
  phoneLabel: 'Phone',
  addressLabel: 'Address',
  linkedinLabel: 'LinkedIn',
  experienceTitle: 'Experiences',
  educationTitle: 'Education',
  skillsTitle: 'Skills',
  certificationsTitle: 'Professional Development',
  volunteerExperienceTitle: 'Volunteer Experience',
  experienceFallback: 'Professional Experience',
  educationFallback: 'Education',
  certificationFallback: 'Certification or Course',
  volunteerFallback: 'Volunteer Experience',
  primaryFontFamily: "'Roboto', Arial, sans-serif",
  secondaryFontFamily: "'Roboto', Arial, sans-serif",
  textAlign: 'left',
  listSeparator: ', ',
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

function renderMeta(parts: string[]): string {
  const metaParts = parts.filter(Boolean).map(escapeHtml);
  return metaParts.length ? `<p class="meta">${metaParts.join(' | ')}</p>` : '';
}

function renderContactValue(label: string, value: string): string {
  return value
    ? `<span class="contact-item"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>`
    : '';
}

function renderContact(contact: CVContactSection, copy: CVHtmlCopy): string {
  const parts = [
    contact.title ? `<p class="contact-title">${escapeHtml(contact.title)}</p>` : '',
    renderContactValue(copy.emailLabel, contact.email),
    renderContactValue(copy.phoneLabel, contact.phone),
    renderContactValue(copy.addressLabel, contact.address),
    renderContactValue(copy.linkedinLabel, contact.linkedin ?? ''),
  ].filter(Boolean);

  if (!parts.length) {
    return '';
  }

  return renderSection(copy.contactTitle, `<div class="contact-grid">${parts.join('')}</div>`);
}

function renderAtsHeader(draft: NormalizedCVDraft, copy: CVHtmlCopy): string {
  const primaryContact = [
    renderInlineContactValue(copy.emailLabel, draft.contact.email),
    renderInlineContactValue(copy.phoneLabel, draft.contact.phone),
    renderInlineContactValue(copy.addressLabel, draft.contact.address),
    renderInlineContactValue(copy.linkedinLabel, draft.contact.linkedin ?? ''),
  ].filter(Boolean);

  return `
    <header class="ats-header">
      ${draft.fullName ? `<h1>${escapeHtml(draft.fullName)}</h1>` : ''}
      ${draft.contact.title ? `<p class="ats-title">${escapeHtml(draft.contact.title)}</p>` : ''}
      ${primaryContact.length ? `<p class="ats-contact-row">${primaryContact.join(', ')}</p>` : ''}
    </header>
  `;
}

function renderInlineContactValue(label: string, value: string): string {
  return value ? `<span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>` : '';
}

function renderAtsExperience(exp: CVExperience, copy: CVHtmlCopy): string {
  const heading =
    copy.lang === 'en'
      ? [exp.title, exp.organization ? `at ${exp.organization}` : ''].filter(Boolean).join(' ')
      : [exp.title, exp.organization].filter(Boolean).join(' - ');
  const bulletItems = exp.description
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);

  return `
    <article class="ats-entry">
      <div class="ats-entry-heading">
        <h3>${escapeHtml(heading || exp.organization || copy.experienceFallback)}</h3>
        ${exp.duration ? `<span>${escapeHtml(exp.duration)}</span>` : ''}
      </div>
      ${
        bulletItems.length
          ? `<ul class="ats-bullets">${bulletItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : ''
      }
    </article>
  `;
}

function renderAtsEducation(education: CVEducation, copy: CVHtmlCopy): string {
  const parts = [education.degree || copy.educationFallback, education.institution, education.year].filter(Boolean);
  return `<p class="ats-line">${parts.map(escapeHtml).join(', ')}</p>`;
}

function renderAtsCertification(certification: CVCertification, copy: CVHtmlCopy): string {
  const parts = [
    certification.name || certification.issuer || copy.certificationFallback,
    certification.issuer,
    certification.details,
    certification.date,
  ].filter(Boolean);
  return `<li>${parts.map(escapeHtml).join(', ')}</li>`;
}

function renderAtsVolunteerExperience(
  volunteerExperience: CVVolunteerExperience,
  copy: CVHtmlCopy,
): string {
  const heading =
    copy.lang === 'en'
      ? [volunteerExperience.role, volunteerExperience.organization].filter(Boolean).join(' at ')
      : [volunteerExperience.role, volunteerExperience.organization].filter(Boolean).join(' - ');
  const parts = [heading || copy.volunteerFallback, volunteerExperience.duration].filter(Boolean);
  const description = volunteerExperience.description
    ? `<p class="body-text">${escapeHtml(volunteerExperience.description)}</p>`
    : '';
  return `
    <article class="ats-entry">
      <p class="ats-line"><strong>${parts.map(escapeHtml).join(' — ')}</strong></p>
      ${description}
    </article>
  `;
}

function renderAtsSkills(skills: CVSkill[]): string {
  if (!skills.length) {
    return '';
  }

  return `<ul class="ats-bullets">${skills.map(skill => `<li>${renderSkill(skill)}</li>`).join('')}</ul>`;
}

function renderAtsSection(title: string, body: string): string {
  return `
    <section class="ats-section">
      <h2>${escapeHtml(title)}:</h2>
      ${body}
    </section>
  `;
}

function renderATSSections(draft: NormalizedCVDraft, copy: CVHtmlCopy): string[] {
  const sections: string[] = [];

  if (draft.summary) {
    sections.push(renderAtsSection(copy.summaryTitle, `<p class="body-text">${escapeHtml(draft.summary)}</p>`));
  }

  if (draft.education.length) {
    sections.push(
      renderAtsSection(
        copy.educationTitle,
        draft.education.map(item => renderAtsEducation(item, copy)).join(''),
      ),
    );
  }

  if (draft.experiences.length) {
    sections.push(
      renderAtsSection(
        copy.experienceTitle,
        draft.experiences.map(experience => renderAtsExperience(experience, copy)).join(''),
      ),
    );
  }

  if (draft.certifications.length) {
    sections.push(
      renderAtsSection(
        copy.certificationsTitle,
        `
          <p class="ats-subhead">${copy.lang === 'en' ? 'Professional Certifications:' : escapeHtml(copy.certificationsTitle)}</p>
          <ul class="ats-bullets">
            ${draft.certifications.map(item => renderAtsCertification(item, copy)).join('')}
          </ul>
        `,
      ),
    );
  }

  if (draft.volunteerExperiences.length) {
    sections.push(
      renderAtsSection(
        copy.volunteerExperienceTitle,
        draft.volunteerExperiences
          .map(item => renderAtsVolunteerExperience(item, copy))
          .join(''),
      ),
    );
  }

  if (draft.skills.length) {
    sections.push(renderAtsSection(copy.skillsTitle, renderAtsSkills(draft.skills)));
  }

  return sections;
}

function renderExperience(exp: CVExperience, copy: CVHtmlCopy): string {
  return `
    <article class="entry">
      <h3>${escapeHtml(exp.title || exp.organization || copy.experienceFallback)}</h3>
      ${renderMeta([exp.organization, exp.duration])}
      ${exp.description ? `<p class="body-text">${escapeHtml(exp.description)}</p>` : ''}
    </article>
  `;
}

function renderEducation(education: CVEducation, copy: CVHtmlCopy): string {
  return `
    <article class="entry">
      <h3>${escapeHtml(education.degree || education.institution || copy.educationFallback)}</h3>
      ${renderMeta([education.institution, education.year])}
    </article>
  `;
}

function renderCertification(certification: CVCertification, copy: CVHtmlCopy): string {
  return `
    <article class="entry">
      <h3>${escapeHtml(certification.name || certification.issuer || copy.certificationFallback)}</h3>
      ${renderMeta([certification.issuer, certification.date])}
      ${certification.details ? `<p class="body-text">${escapeHtml(certification.details)}</p>` : ''}
    </article>
  `;
}

function renderVolunteerExperience(volunteerExperience: CVVolunteerExperience, copy: CVHtmlCopy): string {
  return `
    <article class="entry">
      <h3>${escapeHtml(
        volunteerExperience.role || volunteerExperience.organization || copy.volunteerFallback,
      )}</h3>
      ${renderMeta([volunteerExperience.organization, volunteerExperience.duration])}
      ${volunteerExperience.description ? `<p class="body-text">${escapeHtml(volunteerExperience.description)}</p>` : ''}
    </article>
  `;
}

function renderSkill(skill: CVSkill): string {
  return escapeHtml(skill.value);
}

function renderCompactItems(items: string[], copy: CVHtmlCopy): string {
  if (!items.length) {
    return '';
  }

  return `<p class="compact-list">${items.join(copy.listSeparator)}</p>`;
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
  return renderATSHtml(draft, copy);
}

function renderATSHtml(draft: NormalizedCVDraft, copy: CVHtmlCopy): string {
  const sections = renderATSSections(draft, copy);

  return `
    <!DOCTYPE html>
    <html lang="${copy.lang}" dir="${copy.direction}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(draft.fullName)} | ${copy.pageTitle}</title>
        <style>
          @page {
            margin: 4mm 3mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #000000;
            background: #ffffff;
            direction: ${copy.direction};
            text-align: ${copy.textAlign};
            line-height: 1.2;
            font-family: ${copy.secondaryFontFamily};
            font-size: 10pt;
          }

          .page {
            padding: 0;
          }

          .ats-header {
            margin-bottom: 6pt;
            text-align: center;
            page-break-after: avoid;
          }

          .ats-header h1 {
            margin: 0 0 2pt;
            color: #000000;
            font-family: ${copy.primaryFontFamily};
            font-size: 18pt;
            font-weight: 700;
          }

          .ats-title {
            margin: 0 0 2pt;
            color: #000000;
            font-size: 10pt;
            font-weight: 700;
          }

          .ats-contact-row {
            margin: 0 0 2pt;
            color: #000000;
            font-size: 10pt;
          }

          .ats-section {
            margin-bottom: 9pt;
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .ats-section h2 {
            margin: 4pt 0 3pt;
            color: #1F4E79;
            text-align: center;
            font-family: ${copy.primaryFontFamily};
            font-size: 10pt;
            font-weight: 700;
            page-break-after: avoid;
            break-after: avoid-page;
            border-bottom: 1px solid #1F4E79;
            padding-bottom: 2pt;
          }

          .ats-entry {
            margin-bottom: 4pt;
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .ats-entry-heading {
            display: flex;
            justify-content: space-between;
            gap: 8pt;
            align-items: baseline;
            margin-bottom: 2pt;
          }

          .ats-entry-heading h3 {
            margin: 0;
            color: #000000;
            font-size: 10pt;
            font-family: ${copy.primaryFontFamily};
            font-weight: 700;
          }

          .ats-entry-heading span {
            white-space: nowrap;
            font-size: 10pt;
          }

          .body-text,
          .ats-line,
          .ats-subhead {
            margin: 0 0 2pt;
            font-size: 10pt;
            white-space: pre-wrap;
          }

          .ats-subhead {
            font-weight: 700;
          }

          .ats-bullets {
            margin: ${copy.direction === 'rtl' ? '0 14pt 2pt 0' : '0 0 2pt 14pt'};
            padding-${copy.direction === 'rtl' ? 'right' : 'left'}: 10pt;
          }

          .ats-bullets li {
            margin: 0;
            padding-left: 1pt;
          }

          .ats-bullets li::marker {
            content: "➢  ";
          }
        </style>
      </head>
      <body>
        <main class="page">
          ${renderAtsHeader(draft, copy)}
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
