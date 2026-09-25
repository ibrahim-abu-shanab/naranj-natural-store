export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "")
    .replace(/ı/g, "i")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "");
}
export function matchesSearch(
  record: {
    nameTr: string;
    nameAr: string;
    shortTr: string;
    shortAr: string;
    descriptionTr: string;
    descriptionAr: string;
    category: { nameTr: string; nameAr: string };
    tags: { nameTr: string; nameAr: string }[];
  },
  query: string,
  parent?: { nameTr: string; nameAr: string },
) {
  const haystack = normalizeSearch(
    [
      record.nameTr,
      record.nameAr,
      record.shortTr,
      record.shortAr,
      record.descriptionTr,
      record.descriptionAr,
      record.category.nameTr,
      record.category.nameAr,
      parent?.nameTr,
      parent?.nameAr,
      ...record.tags.flatMap((t) => [t.nameTr, t.nameAr]),
    ].join(" "),
  );
  return normalizeSearch(query)
    .trim()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}
