/**
 * Company facts required by German law. Nothing here is invented: every value
 * is a visible placeholder until BoLaGio GmbH supplies the real data.
 * Overridable via site_settings (key: legal.<field>).
 */
export const legalPlaceholders = {
  legalName: "BoLaGio GmbH",
  registeredOffice: "{{SITZ DER GESELLSCHAFT}}",
  street: "Schulstraße 1",
  postalCity: "95444 Bayreuth",
  managingDirectors: "{{GESCHÄFTSFÜHRER:IN(NEN)}}",
  registerCourt: "{{REGISTERGERICHT}}",
  registerNumber: "{{HRB-NUMMER}}",
  vatId: "{{USt-IdNr.}}",
  email: "{{KONTAKT-E-MAIL}}",
  phone: "{{TELEFON}}",
  supervisoryAuthority: "{{ZUSTÄNDIGE AUFSICHTSBEHÖRDE, FALLS ERFORDERLICH}}",
  responsibleForContent: "{{VERANTWORTLICH I.S.D. § 18 ABS. 2 MStV}}",
  dataProtectionContact: "{{DATENSCHUTZ-KONTAKT}}",
} as const;

export type LegalPlaceholders = typeof legalPlaceholders;

export function resolveLegal(overrides: Record<string, unknown>): LegalPlaceholders {
  const out = { ...legalPlaceholders } as Record<string, string>;
  for (const key of Object.keys(out)) {
    const v = overrides[`legal.${key}`];
    if (typeof v === "string" && v.trim()) out[key] = v;
  }
  return out as LegalPlaceholders;
}

export const isPlaceholder = (v: string) => v.startsWith("{{");
