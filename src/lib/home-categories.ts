const definitions = [
  ["category-cosmetics", "bakim-guzellik", "مستحضرات التجميل", "Kozmetik Ürünleri", "منتجات مختارة للعناية والجمال والاستخدام اليومي.", "Bakım, güzellik ve günlük kullanım için özenle seçilmiş ürünler.", ["kozmetik-urunleri", "cilt-bakimi"]],
  ["category-cupping", "hacamat-malzemeleri", "الحجامة ومستلزماتها", "Hacamat ve Malzemeleri", "أدوات ومستلزمات الحجامة المختارة بعناية.", "Hacamat uygulamaları için özenle seçilmiş ürün ve malzemeler.", ["hacamat-ve-malzemeleri"]],
  ["category-hair-body", "sac-vucut-bakimi", "العناية بالشعر والجسم", "Saç ve Vücut Bakımı", "منتجات وزيوت للعناية بالشعر والجسم للاستخدام اليومي.", "Günlük saç ve vücut bakımı için ürünler ve doğal yağlar.", ["sac-ve-vucut-bakimi", "sac-bakimi"]],
  ["category-herbs", "bitkisel-urunler", "الأعشاب والخلطات", "Bitkiler ve Karışımlar", "تشكيلة مختارة من الأعشاب والخلطات الطبيعية.", "Özenle seçilmiş bitkiler ve doğal karışımlar.", ["bitkiler-ve-karisimlar", "bitkiler-ve-bitkisel-karisimlar"]],
  ["category-honey-natural", "bal-ve-dogal-urunler", "العسل والمنتجات الطبيعية", "Bal ve Doğal Ürünler", "عسل ومنتجات طبيعية مختارة بعناية وجودة.", "Özenle seçilmiş bal çeşitleri ve doğal ürünler.", []],
] as const;

export const homeCategories = definitions.map(
  ([file, slug, nameAr, nameTr, descriptionAr, descriptionTr, aliases]) => ({
    slug, nameAr, nameTr, descriptionAr, descriptionTr,
    aliases: aliases as readonly string[],
    image: `/images/naranj/${file}.webp`,
  }),
);
