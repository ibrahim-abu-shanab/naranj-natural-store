export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "money"
    | "checkbox"
    | "image"
    | "category"
    | "parent"
    | "tags"
    | "collections";
  required?: boolean;
};
const names: Field[] = [
  { key: "nameTr", label: "الاسم بالتركية", required: true },
  { key: "nameAr", label: "الاسم بالعربية", required: true },
];
const slug: Field = { key: "slug", label: "الرابط المختصر", required: true };
const descriptions: Field[] = [
  { key: "descriptionTr", label: "الوصف بالتركية", type: "textarea" },
  { key: "descriptionAr", label: "الوصف بالعربية", type: "textarea" },
];
const seoFields: Field[] = [
  { key: "seoTitleTr", label: "عنوان محركات البحث بالتركية" },
  { key: "seoTitleAr", label: "عنوان محركات البحث بالعربية" },
  {
    key: "seoDescriptionTr",
    label: "وصف محركات البحث بالتركية",
    type: "textarea",
  },
  {
    key: "seoDescriptionAr",
    label: "وصف محركات البحث بالعربية",
    type: "textarea",
  },
];
const status: Field[] = [
  { key: "sortOrder", label: "ترتيب العرض", type: "number" },
  { key: "active", label: "نشط", type: "checkbox" },
];
export const resourceLabels = {
  products: "المنتجات",
  categories: "التصنيفات",
  tags: "الاحتياجات",
  collections: "المجموعات",
  slides: "شرائح الصفحة الرئيسية",
  articles: "المقالات",
  settings: "إعدادات الموقع",
  pages: "الصفحات",
};
export const fields: Record<keyof typeof resourceLabels, Field[]> = {
  products: [
    ...names,
    { ...slug, required: false },
    { key: "sku", label: "رمز المنتج" },
    { key: "shortTr", label: "الوصف المختصر بالتركية" },
    { key: "shortAr", label: "الوصف المختصر بالعربية" },
    ...descriptions.map((f) => ({ ...f, required: true })),
    ...["ingredients", "usage", "warnings", "features"].flatMap((key) => [
      {
        key: key + "Tr",
        label:
          ({
            ingredients: "المكونات",
            usage: "طريقة الاستخدام",
            warnings: "التحذيرات",
            features: "الخصائص",
          }[key] || key) + " بالتركية",
        type: "textarea" as const,
        required: false,
      },
      {
        key: key + "Ar",
        label:
          ({
            ingredients: "المكونات",
            usage: "طريقة الاستخدام",
            warnings: "التحذيرات",
            features: "الخصائص",
          }[key] || key) + " بالعربية",
        type: "textarea" as const,
        required: false,
      },
    ]),
    {
      key: "price",
      label: "السعر بالليرة التركية",
      type: "money",
      required: true,
    },
    {
      key: "oldPrice",
      label: "السعر السابق بالليرة التركية",
      type: "money",
    },
    { key: "size", label: "الحجم أو الوزن" },
    { key: "stock", label: "المخزون", type: "number" },
    {
      key: "categoryId",
      label: "التصنيف",
      type: "category",
      required: true,
    },
    { key: "tagIds", label: "الاحتياجات", type: "tags" },
    {
      key: "collectionIds",
      label: "المجموعات",
      type: "collections",
    },
    ...["featured", "isNew", "bestSeller", "active", "archived"].map((key) => ({
      key,
      label:
        {
          featured: "مميز",
          isNew: "جديد",
          bestSeller: "الأكثر مبيعًا",
          active: "نشط",
          archived: "مؤرشف",
        }[key] || key,
      type: "checkbox" as const,
    })),
    ...seoFields,
  ],
  categories: [
    ...seoFields,
    ...names,
    slug,
    ...descriptions,
    { key: "image", label: "الصورة", type: "image", required: true },
    {
      key: "parentId",
      label: "التصنيف الرئيسي",
      type: "parent",
    },
    { key: "sortOrder", label: "ترتيب العرض", type: "number" },
    { key: "active", label: "نشط / مخفي", type: "checkbox" },
  ],
  tags: [...names, slug, ...status],
  collections: [...names, slug, ...descriptions, ...status],
  slides: [
    {
      key: "desktopImage",
      label: "صورة الشريحة",
      type: "image",
      required: true,
    },
    { key: "titleAr", label: "العنوان بالعربية", required: true },
    { key: "titleTr", label: "العنوان بالتركية", required: true },
    { key: "descriptionAr", label: "النص بالعربية", type: "textarea" },
    { key: "descriptionTr", label: "النص بالتركية", type: "textarea" },
    {
      key: "url",
      label: "رابط الزر / الوجهة",
      required: true,
    },
    { key: "sortOrder", label: "ترتيب الظهور", type: "number" },
    { key: "active", label: "نشط / مخفي", type: "checkbox" },
  ],
  articles: [
    ...seoFields,
    { key: "titleTr", label: "العنوان بالتركية", required: true },
    { key: "titleAr", label: "العنوان بالعربية", required: true },
    slug,
    { key: "excerptTr", label: "المقدمة بالتركية", required: true },
    { key: "excerptAr", label: "المقدمة بالعربية", required: true },
    {
      key: "bodyTr",
      label: "المحتوى بالتركية",
      type: "textarea",
      required: true,
    },
    {
      key: "bodyAr",
      label: "المحتوى بالعربية",
      type: "textarea",
      required: true,
    },
    { key: "image", label: "الصورة", type: "image", required: true },
    { key: "author", label: "الكاتب", required: true },
    { key: "active", label: "نشط", type: "checkbox" },
  ],
  settings: [
    {
      key: "whatsapp",
      label: "رقم واتساب مع رمز الدولة (أرقام فقط)",
    },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "الهاتف" },
    { key: "addressTr", label: "العنوان بالتركية", type: "textarea" },
    { key: "addressAr", label: "العنوان بالعربية", type: "textarea" },
    { key: "instagram", label: "رابط إنستغرام الآمن" },
    { key: "facebook", label: "رابط فيسبوك الآمن" },
    { key: "announcementTr", label: "الإعلان بالتركية" },
    { key: "announcementAr", label: "الإعلان بالعربية" },
    {
      key: "seoTitleTr",
      label: "عنوان محركات البحث الافتراضي بالتركية",
      required: true,
    },
    {
      key: "seoTitleAr",
      label: "عنوان محركات البحث الافتراضي بالعربية",
      required: true,
    },
    {
      key: "seoDescriptionTr",
      label: "وصف محركات البحث الافتراضي بالتركية",
      required: true,
    },
    {
      key: "seoDescriptionAr",
      label: "وصف محركات البحث الافتراضي بالعربية",
      required: true,
    },
  ],
  pages: [
    { key: "titleTr", label: "العنوان بالتركية", required: true },
    { key: "titleAr", label: "العنوان بالعربية", required: true },
    slug,
    {
      key: "bodyTr",
      label: "المحتوى بالتركية",
      type: "textarea",
      required: true,
    },
    {
      key: "bodyAr",
      label: "المحتوى بالعربية",
      type: "textarea",
      required: true,
    },
  ],
};
