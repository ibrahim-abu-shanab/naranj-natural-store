const image = (name: string) => `/images/naranj/${name}.webp`;

export const storefrontSlides = [
  {
    id: "natural-products",
    titleAr: "من الطبيعة بعناية",
    descriptionAr: "منتجات طبيعية مختارة بعناية لتكون أقرب إلى احتياجاتك اليومية",
    titleTr: "Doğadan Özenle",
    descriptionTr: "Günlük ihtiyaçlarınız için özenle seçilmiş doğal ürünler",
    ctaAr: "تسوق الآن", ctaTr: "Ürünleri Keşfet",
    url: "/products",
    desktopImage: image("hero-natural-products"),
    mobileImage: image("hero-natural-products"),
  },
  {
    id: "hair-care",
    titleAr: "عناية متكاملة لشعرك",
    descriptionAr: "اكتشف منتجات مختارة للعناية بالشعر والحفاظ على مظهره",
    titleTr: "Saçınız İçin Özenli Bakım",
    descriptionTr: "Saç bakımınız için özenle seçilmiş ürünleri keşfedin",
    ctaAr: "اكتشف المنتجات", ctaTr: "Ürünleri Keşfet",
    url: "/products",
    desktopImage: image("hero-hair-care"),
    mobileImage: image("hero-hair-care"),
  },
  {
    id: "honey-herbs",
    titleAr: "العسل والأعشاب الطبيعية",
    descriptionAr: "تشكيلة مختارة من العسل والأعشاب والمنتجات الطبيعية",
    titleTr: "Bal ve Doğal Bitkiler",
    descriptionTr: "Özenle seçilmiş bal, bitkiler ve doğal ürünler",
    ctaAr: "اكتشف المجموعة", ctaTr: "Koleksiyonu Keşfet",
    url: "/products",
    desktopImage: image("hero-honey-herbs"),
    mobileImage: image("hero-honey-herbs"),
  },
];

const categoryImages = [
  { file: "category-cupping", slugs: ["hacamat-malzemeleri", "hacamat-ve-malzemeleri"], names: ["الحجامة ومستلزماتها", "Hacamat ve Malzemeleri"] },
  { file: "category-herbs", slugs: ["bitkisel-urunler", "bitkiler-ve-bitkisel-karisimlar"], names: ["الخلطات والأعشاب", "Bitkiler ve Bitkisel Karışımlar"] },
  { file: "category-cosmetics", slugs: ["bakim-guzellik", "kozmetik-urunleri", "cilt-bakimi"], names: ["المواد التجميلية", "Kozmetik Ürünleri"] },
  { file: "category-hair-body", slugs: ["sac-vucut-bakimi", "sac-ve-vucut-bakimi", "sac-bakimi", "vucut-bakimi"], names: ["العناية بالشعر والجسم", "Saç ve Vücut Bakımı"] },
  { file: "category-honey-natural", slugs: ["bal-ve-dogal-urunler"], names: ["العسل والمنتجات الطبيعية", "Bal ve Doğal Ürünler"] },
];

export function categoryImage(category: { slug: string; nameAr: string; nameTr: string; image: string }) {
  const match = categoryImages.find((entry) =>
    entry.slugs.includes(category.slug) ||
    entry.names.includes(category.nameAr.trim()) ||
    entry.names.includes(category.nameTr.trim()),
  );
  return match ? image(match.file) : category.image;
}
