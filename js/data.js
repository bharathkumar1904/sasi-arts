const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Premium Wooden Photo Frame', category: 'Personalized Photo Frames', price: 499, oldPrice: 799, image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', rating: 4.8, reviews: 156, badge: 'best', bestSeller: true, is_active: true },
  { id: 2, name: 'LED Backlit Photo Frame 8x6', category: 'LED Photo Frames', price: 899, oldPrice: 1499, image: 'https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?w=400', rating: 4.9, reviews: 234, badge: 'sale', bestSeller: true, is_active: true },
  { id: 3, name: 'Custom Acrylic Name Plate', category: 'Acrylic Gifts', price: 349, oldPrice: 599, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', rating: 4.7, reviews: 89, badge: 'new', bestSeller: true, is_active: true },
  { id: 4, name: '3D Moon Lamp with Custom Photo', category: 'Moon Lamps', price: 1299, oldPrice: 1999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', rating: 4.9, reviews: 312, badge: 'best', bestSeller: true, is_active: true },
  { id: 5, name: 'Magic Mirror with LED Lights', category: 'Magic Mirrors', price: 699, oldPrice: 999, image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', rating: 4.6, reviews: 78, badge: 'new', bestSeller: false, is_active: true },
  { id: 6, name: 'Personalized Photo Mug', category: 'Photo Mugs', price: 299, oldPrice: 499, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', rating: 4.5, reviews: 445, badge: '', bestSeller: true, is_active: true },
  { id: 7, name: 'Custom Printed Cushion Cover', category: 'Cushions', price: 449, oldPrice: 699, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400', rating: 4.4, reviews: 67, badge: '', bestSeller: false, is_active: true },
  { id: 8, name: 'Photo Wall Clock 12 inch', category: 'Photo Clocks', price: 799, oldPrice: 1299, image: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=400', rating: 4.7, reviews: 123, badge: 'sale', bestSeller: true, is_active: true },
  { id: 9, name: 'Crystal Glass Engraved Frame', category: 'Crystal Gifts', price: 599, oldPrice: 899, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', rating: 4.8, reviews: 198, badge: 'best', bestSeller: true, is_active: true },
  { id: 10, name: 'Custom Name Keychain Set', category: 'Keychains', price: 149, oldPrice: 299, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', rating: 4.3, reviews: 256, badge: '', bestSeller: false, is_active: true },
  { id: 11, name: 'Elegant Name Plate for Home', category: 'Name Plates', price: 399, oldPrice: 649, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', rating: 4.6, reviews: 89, badge: 'new', bestSeller: true, is_active: true },
  { id: 12, name: 'Corporate Gift Hamper', category: 'Corporate Gifts', price: 2499, oldPrice: 3999, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', rating: 4.9, reviews: 45, badge: '', bestSeller: false, is_active: true },
  { id: 13, name: 'Customized Birthday Photo Collage', category: 'Birthday Gifts', price: 599, oldPrice: 999, image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400', rating: 4.7, reviews: 88, badge: 'new', bestSeller: false, is_active: true },
  { id: 14, name: 'Anniversary LED Name Frame', category: 'Anniversary Gifts', price: 1099, oldPrice: 1699, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', rating: 4.8, reviews: 134, badge: 'best', bestSeller: true, is_active: true },
  { id: 15, name: 'Wedding Guest Photo Frame Set', category: 'Wedding Gifts', price: 1499, oldPrice: 2299, image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400', rating: 4.9, reviews: 67, badge: 'sale', bestSeller: false, is_active: true },
  { id: 20, name: 'Custom Pencil Sketch Portrait', category: 'Sketch Art', price: 1500, oldPrice: 0, image: 'images/WhatsApp Image 2026-06-21 at 11.53.58 AM.jpeg', rating: 4.9, reviews: 42, badge: 'new', bestSeller: false, is_active: true, allInclusive: true, customizable: true },
  { id: 21, name: 'Custom Couple Pencil Sketch', category: 'Sketch Art', price: 1500, oldPrice: 0, image: 'images/WhatsApp Image 2026-06-21 at 11.53.11 AM.jpeg', rating: 4.8, reviews: 28, badge: '', bestSeller: false, is_active: true, allInclusive: true, customizable: true },
  { id: 22, name: 'Custom Family Pencil Sketch', category: 'Sketch Art', price: 1500, oldPrice: 0, image: 'images/WhatsApp Image 2026-06-19 at 12.56.38 PM.jpeg', rating: 4.9, reviews: 35, badge: '', bestSeller: false, is_active: true, allInclusive: true, customizable: true },
  { id: 23, name: 'Custom Blood Art Portrait', category: 'Blood Art', price: 0, oldPrice: 0, image: 'images/WhatsApp Image 2026-06-21 at 12.04.47 PM.jpeg', rating: 4.7, reviews: 15, badge: 'new', bestSeller: false, is_active: true, whatsappOnly: true },
  { id: 24, name: 'Custom Blood Art Name Art', category: 'Blood Art', price: 0, oldPrice: 0, image: 'images/WhatsApp Image 2026-06-21 at 12.17.46 PM.jpeg', rating: 4.6, reviews: 11, badge: '', bestSeller: false, is_active: true, whatsappOnly: true },
];

const SAMPLE_GALLERY = [
  { image: 'images/WhatsApp Image 2026-06-21 at 12.08.44 PM.jpeg', caption: 'Birthday gift frame' },
  { image: 'images/71kMbCYxjIL._SL1500_.jpg', caption: 'LED frame with couple photo' },
  { image: 'images/WhatsApp Image 2026-06-19 at 12.55.54 PM.jpeg', caption: 'Acrylic name plate' },
  { image: 'images/6133RD4fgqL._SL1024_.jpg', caption: 'Custom moon lamp' },
  { image: 'images/clock.jpg', caption: 'Photo clock gift' },
  { image: 'images/WhatsApp Image 2026-06-19 at 12.56.38 PM.jpeg', caption: 'Crystal engraved frame' },
  { image: 'images/magical-photo-frame-mirror-2-in-1-led-display-frame-with-smart-original-imah6zhqftzzkvtg.webp', caption: 'Magic mirror with name' },
  { image: 'images/WhatsApp Image 2026-06-21 at 11.53.58 AM.jpeg', caption: 'Custom pencil sketch portrait' },
  { image: 'images/WhatsApp Image 2026-06-21 at 11.53.11 AM.jpeg', caption: 'Hand-drawn couple sketch' },
  { image: 'images/WhatsApp Image 2026-06-21 at 12.04.47 PM.jpeg', caption: 'Blood art custom portrait' },
];

const SAMPLE_REVIEWS = [
  { name: 'Balaji', rating: 5, text: 'Absolutely beautiful! The LED frame exceeded my expectations. The engraving was perfect and delivery was on time.', product: 'LED Photo Frame', avatar: 'PS', verified: true },
  { name: 'Bharath Kumar', rating: 5, text: 'Ordered for my parents anniversary. They loved it! The quality of the acrylic frame is top notch. Will order again.', product: 'Acrylic Frame', avatar: 'RV', verified: true },
  { name: 'Ananya Patel', rating: 4, text: 'Great personalized mug. Print quality is excellent and it survived the dishwasher. Fast shipping too!', product: 'Photo Mug', avatar: 'AP', verified: true },
  { name: 'Vikram Singh', rating: 5, text: 'The moon lamp is magical! My daughter was overjoyed. Customization was done exactly as I requested.', product: 'Moon Lamp', avatar: 'VS', verified: true },
  { name: 'Neha Gupta', rating: 5, text: 'Best gift store for personalized items. I have ordered 5+ times and always impressed with the quality.', product: 'Various', avatar: 'NG', verified: true },
  { name: 'Amit Kumar', rating: 4, text: 'Good quality photo frame. The wooden finish is premium. Slight delay in delivery but worth the wait.', product: 'Wooden Frame', avatar: 'AK', verified: true },
];

const CATEGORY_ICONS = {
  'Personalized Photo Frames': '🖼️',
  'LED Photo Frames': '💡',
  'Acrylic Gifts': '✨',
  'Moon Lamps': '🌙',
  'Magic Mirrors': '🪞',
  'Photo Mugs': '☕',
  'Cushions': '🛋️',
  'Photo Clocks': '⏰',
  'Crystal Gifts': '💎',
  'Keychains': '🔑',
  'Name Plates': '📛',
  'Corporate Gifts': '💼',
  'Birthday Gifts': '🎂',
  'Anniversary Gifts': '💑',
  'Wedding Gifts': '💒',
  'Sketch Art': '✏️',
  'Blood Art': '🎨'
};
