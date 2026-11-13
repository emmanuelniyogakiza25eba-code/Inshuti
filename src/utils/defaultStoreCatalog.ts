export type BuiltInDepartment = 'WOMEN' | 'MEN';
export type BuiltInSection = 'The Latest Drops' | 'Kigali Everyday Essentials' | 'Limited Editions & Event Wear' | 'Footwear & Accessories';
export type BuiltInProductKind = 'Clothing' | 'Shoes';

export type BuiltInStoreProduct = {
  id: string;
  department: BuiltInDepartment;
  section: BuiltInSection;
  name: string;
  type: string;
  color: string;
  price: number;
  oldPrice?: number;
  image: string;
  galleryImages: string[];
  savedCount: number;
  availableSizes: string[];
  productKind: BuiltInProductKind;
  limitedOffer: boolean;
};

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

const womenImages = [
  pexels(36282561), pexels(21240745), pexels(37654683), pexels(19804506),
  pexels(35865604), pexels(16649253), pexels(33347574), pexels(17125152),
  unsplash('photo-1672491375900-fec106ef9419'), unsplash('photo-1770182023639-a650abe44267'),
  pexels(6766168), pexels(9391860),
];

const menImages = [
  pexels(2297720), pexels(17842463), pexels(3075712), pexels(3220388),
  pexels(2072453), unsplash('photo-1640032004545-a2ee4d4b8843'),
  unsplash('photo-1771919322950-8b9500607616'), unsplash('photo-1771736823300-0426c311e07d'),
  unsplash('photo-1640032004545-a2ee4d4b8843'), pexels(17842463),
  pexels(2297720), pexels(3075712),
];

const groups: {
  section: BuiltInSection;
  names: string[];
  types: string[];
  prices: number[];
  productKind?: BuiltInProductKind;
}[] = [
  {
    section: 'The Latest Drops',
    names: ['Kigali Graphic Tee', 'Studio Oversized Shirt', 'City Layer Jacket', 'Everyday Polo', 'Rwanda Print Tee', 'Relaxed Fit Shirt', 'Weekend Co-ord', 'New Season Hoodie'],
    types: ['Graphic T-Shirt', 'Oversized T-Shirt', 'Light Jacket', 'Cotton Polo', 'Graphic T-Shirt', 'Casual Shirt', 'Two-Piece Set', 'Streetwear Hoodie'],
    prices: [12000, 25000, 45000, 25000, 15000, 30000, 45000, 45000],
  },
  {
    section: 'Kigali Everyday Essentials',
    names: ['Everyday Cotton Tee', 'Essential Crew Tee', 'Soft Cotton Polo', 'Relaxed Cotton Shirt', 'Classic White Tee', 'Daily Wear Tee', 'Kigali Casual Top', 'Core Cotton Polo'],
    types: ['100% Cotton T-Shirt', '100% Cotton T-Shirt', '100% Cotton Polo', 'Casual Shirt', '100% Cotton T-Shirt', '100% Cotton T-Shirt', 'Casual Top', '100% Cotton Polo'],
    prices: [12000, 12000, 25000, 30000, 12000, 12000, 25000, 25000],
  },
  {
    section: 'Limited Editions & Event Wear',
    names: ['Imena Occasion Set', 'Kigali Night Shirt', 'Heritage Print Piece', 'Tailored Event Look', 'Limited Drop Jacket', 'Celebration Co-ord', 'Signature Dress Shirt', 'One-of-One Graphic Tee'],
    types: ['Event Wear', 'Statement Shirt', 'Limited Edition', 'Tailored Set', 'Limited Edition', 'Event Wear', 'Tailored Shirt', 'Exclusive Drop'],
    prices: [45000, 30000, 45000, 65000, 55000, 65000, 45000, 25000],
  },
  {
    section: 'Footwear & Accessories',
    names: ['City Runner Sneakers', 'Everyday Low-Top Sneakers', 'Kigali Canvas Sneakers', 'Street Classic Trainers', 'Kigali Leather Loafers', 'Kigali Weekend Sandals', 'Signature Court Shoes', 'Kigali Evening Heels'],
    types: ['Sneakers', 'Low-Top Sneakers', 'Canvas Shoes', 'Trainers', 'Leather Loafers', 'Sandals', 'Court Shoes', 'Heels'],
    prices: [45000, 45000, 25000, 45000, 45000, 25000, 55000, 45000],
    productKind: 'Shoes',
  },
];

function buildProducts(images: string[], department: BuiltInDepartment): BuiltInStoreProduct[] {
  return groups.flatMap((group, groupIndex) => group.names.map((name, index) => {
    const isShoeGroup = group.productKind === 'Shoes';
    const imageIndex = (groupIndex * 3 + index) % images.length;
    return {
      id: `${department}-${groupIndex}-${index}`,
      department,
      section: group.section,
      name: `${department === 'WOMEN' ? "Women's" : "Men's"} ${name}`,
      type: group.types[index],
      color: ['Black', 'Cream', 'Charcoal', 'White', 'Olive', 'Navy', 'Stone', 'Rust'][(groupIndex * 2 + index) % 8],
      price: group.prices[index],
      ...(index === 2 || index === 6 ? { oldPrice: group.prices[index] + 10000 } : {}),
      image: images[imageIndex],
      galleryImages: [0, 1, 2, 3].map((offset) => images[(imageIndex + offset) % images.length]),
      savedCount: isShoeGroup ? 72 + ((index + (department === 'MEN' ? 1 : 0)) * 19) % 180 : 142 + ((groupIndex * 8 + index) * 23) % 380,
      availableSizes: isShoeGroup ? ['38', '39', '40', '41', '42', '43', '44', '45'] : ['S', 'M', 'L', 'XL', 'XXL'],
      productKind: isShoeGroup ? 'Shoes' as const : 'Clothing' as const,
      limitedOffer: index === 2 || index === 6,
    };
  }));
}

export const defaultStoreProducts: BuiltInStoreProduct[] = [
  ...buildProducts(womenImages, 'WOMEN'),
  ...buildProducts(menImages, 'MEN'),
];
