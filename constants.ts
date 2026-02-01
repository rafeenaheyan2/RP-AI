
import { ClothingOption } from './types';

export const CLOTHING_OPTIONS: ClothingOption[] = [
  // Male Options
  {
    id: 'm1',
    name: 'Blue Suit',
    thumbnail: 'https://img.freepik.com/free-photo/blue-suit-isolated_1048-3814.jpg',
    prompt: 'a professional and sharp formal navy blue suit for a man, high quality, realistic fabric texture',
    gender: 'male'
  },
  {
    id: 'm2',
    name: 'Black Suit',
    thumbnail: 'https://img.freepik.com/free-photo/black-suit-isolated_1048-3813.jpg',
    prompt: 'a sophisticated formal black tuxedo or charcoal black business suit, high quality',
    gender: 'male'
  },
  {
    id: 'm3',
    name: 'White Shirt',
    thumbnail: 'https://img.freepik.com/free-photo/white-shirt-isolated_1048-3812.jpg',
    prompt: 'a crisp, clean formal white dress shirt, well-ironed, realistic details',
    gender: 'male'
  },
  {
    id: 'm4',
    name: 'Grey Blazer',
    thumbnail: 'https://images.unsplash.com/photo-1594932224010-72019460953a?q=80&w=300&auto=format&fit=crop',
    prompt: 'a modern slim-fit light grey blazer with a crisp white shirt underneath, high-end professional look',
    gender: 'male'
  },
  {
    id: 'm5',
    name: 'Navy Blazer',
    thumbnail: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=300&auto=format&fit=crop',
    prompt: 'a classic navy blue blazer with brass buttons, styled for a preppy formal appearance',
    gender: 'male'
  },
  {
    id: 'm6',
    name: 'Tuxedo',
    thumbnail: 'https://images.unsplash.com/photo-1555069519-048ef050b46e?q=80&w=300&auto=format&fit=crop',
    prompt: 'a premium black formal tuxedo with a bow tie and silk lapels, high-end red carpet look',
    gender: 'male'
  },
  {
    id: 'm7',
    name: 'Waistcoat',
    thumbnail: 'https://images.unsplash.com/photo-1598808503744-44d994656bb4?q=80&w=300&auto=format&fit=crop',
    prompt: 'a formal tailored charcoal grey waistcoat over a crisp white shirt, sharp business look',
    gender: 'male'
  },
  {
    id: 'm8',
    name: 'Panjabi',
    thumbnail: 'https://images.unsplash.com/photo-1621252110599-43c220f18838?q=80&w=300&auto=format&fit=crop',
    prompt: 'a traditional formal elegant white cotton Punjabi with subtle embroidery on neck',
    gender: 'male'
  },
  {
    id: 'm9',
    name: 'Black Panjabi',
    thumbnail: 'https://images.unsplash.com/photo-1599032906816-f894ee11c88d?q=80&w=300&auto=format&fit=crop',
    prompt: 'a premium black silk panjabi with elegant buttons, traditional formal attire',
    gender: 'male'
  },
  {
    id: 'm11',
    name: 'Red Panjabi',
    thumbnail: 'https://images.unsplash.com/photo-1599032906816-f894ee11c88d?q=80&w=300&auto=format&fit=crop',
    prompt: 'a premium vibrant red silk panjabi with elegant gold buttons, traditional formal attire, high-end professional look',
    gender: 'male'
  },
  {
    id: 'm12',
    name: 'Lungi & Shirt',
    thumbnail: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=300&auto=format&fit=crop',
    prompt: 'a traditional South Asian check-patterned lungi (sarong) paired with a formal button-down shirt, realistic fabric textures, cultural formal attire',
    gender: 'male'
  },
  {
    id: 'm10',
    name: 'Beige Suit',
    thumbnail: 'https://images.unsplash.com/photo-1598808503744-44d994656bb4?q=80&w=300&auto=format&fit=crop',
    prompt: 'a sophisticated beige formal suit, summer business style',
    gender: 'male'
  },

  // Female Options
  {
    id: 'f1',
    name: 'Power Suit',
    thumbnail: 'https://images.unsplash.com/photo-1485231183945-3dec43551286?q=80&w=300&auto=format&fit=crop',
    prompt: 'a tailored professional women\'s charcoal grey business suit with a formal silk blouse, elegant and powerful',
    gender: 'female'
  },
  {
    id: 'f2',
    name: 'Silk Blouse',
    thumbnail: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=80&w=300&auto=format&fit=crop',
    prompt: 'a high-end formal white silk blouse for women, sophisticated office wear, elegant texture',
    gender: 'female'
  },
  {
    id: 'f3',
    name: 'Red Blazer',
    thumbnail: 'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?q=80&w=300&auto=format&fit=crop',
    prompt: 'a sharp tailored red formal blazer for women, modern professional business look',
    gender: 'female'
  },
  {
    id: 'f4',
    name: 'Office Dress',
    thumbnail: 'https://images.unsplash.com/photo-1567306301498-519dde99a07f?q=80&w=300&auto=format&fit=crop',
    prompt: 'a professional black formal knee-length sheath dress, elegant office business attire',
    gender: 'female'
  },
  {
    id: 'f5',
    name: 'Saree',
    thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop',
    prompt: 'an elegant traditional formal jamdani saree with sophisticated patterns, professional look',
    gender: 'female'
  },
  {
    id: 'f6',
    name: 'White Blazer',
    thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300&auto=format&fit=crop',
    prompt: 'a crisp tailored white blazer for women, modern high-end professional appearance',
    gender: 'female'
  },
  {
    id: 'f7',
    name: 'Navy Suit',
    thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300&auto=format&fit=crop',
    prompt: 'a sleek navy blue women\'s formal pantsuit, professional and elegant',
    gender: 'female'
  },
  {
    id: 'f8',
    name: 'Red Saree',
    thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop',
    prompt: 'a stunning red traditional silk saree with gold borders, formal wedding or event attire',
    gender: 'female'
  },
  {
    id: 'f9',
    name: 'Beige Blazer',
    thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300&auto=format&fit=crop',
    prompt: 'a sophisticated beige blazer over a formal white top, chic business look',
    gender: 'female'
  },
  {
    id: 'f10',
    name: 'Blue Saree',
    thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop',
    prompt: 'a deep blue formal saree with elegant minimalistic patterns, professional formal wear',
    gender: 'female'
  }
];

export const FILTER_OPTIONS = [
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'fa-camera-retro',
    prompt: 'Apply a warm vintage 70s film look to this photo with slight grain, soft edges, and slightly desaturated nostalgic colors.'
  },
  {
    id: 'bw',
    name: 'B & W',
    icon: 'fa-mountain-sun',
    prompt: 'Convert this photo to high-contrast, professional black and white portrait style with deep blacks and bright highlights.'
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: 'fa-scroll',
    prompt: 'Apply a classic antique sepia tone filter to the entire image for a timeless historical look.'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: 'fa-film',
    prompt: 'Apply a modern cinematic color grade with rich contrast, teal-and-orange color balancing, and sharp professional focus.'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    icon: 'fa-bolt',
    prompt: 'Enhance the colors and lighting of this image to be extremely vibrant, sharp, and high-definition without looking artificial.'
  }
];

export const APP_TITLE = "RAFEE PHOTO AI";
