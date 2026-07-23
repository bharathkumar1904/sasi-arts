function dataHash() {
  let s = 'c2|' + JSON.stringify(SAMPLE_PRODUCTS.map(p => [p.id, p.name, p.price, p.oldPrice, p.image, p.badge, p.bestSeller, p.is_active]));
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return 'd' + Math.abs(h).toString(36);
}
const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Baby Birthday memories frame 10/15', category: 'Personalized Photo Frames', price: 499, oldPrice: 899, image: 'images/WhatsApp Image 2026-07-22 at 8.29.52 PM.jpeg', rating: 4.8, reviews: 156, badge: 'best', bestSeller: true },
  // Sketch Art — add your local images to the images/ folder
  { id: 20, name: 'Custom Pencil Sketch Portrait', category: 'Sketch Art', price: 1500, oldPrice: 2000, image: 'images/WhatsApp Image 2026-06-21 at 11.53.11 AM.jpeg', rating: 4.9, reviews: 42, badge: 'new', bestSeller: false, allInclusive: true, customizable: true },
  { id: 23, name: 'Custom Blood Art Portrait', category: 'Blood Art', price: 2000, oldPrice: 3000, image: 'images/WhatsApp Image 2026-06-21 at 12.17.46 PM.jpeg', rating: 4.7, reviews: 15, badge: 'new', bestSeller: false, whatsappOnly: true },
  { id: 24, name: 'Custom Blood Art Name Art', category: 'Blood Art', price: 2000, oldPrice: 3000, image: 'images/WhatsApp Image 2026-06-21 at 12.17.46 PM.jpeg', rating: 4.6, reviews: 11, badge: '', bestSeller: false, whatsappOnly: true },
];

const SAMPLE_GALLERY = [
  { image: 'images/WhatsApp Image 2026-06-21 at 12.08.44 PM.jpeg', caption: 'Birthday gift frame' },
  { image: 'images/71kMbCYxjIL._SL1500_.jpg', caption: 'LED frame with couple photo' },
  { image: 'images/WhatsApp Image 2026-06-19 at 12.55.54 PM.jpeg', caption: 'Acrylic name plate' },
  { image: 'images/6133RD4fgqL._SL1024_.jpg', caption: 'Custom moon lamp' },
  { image: 'images/clock.jpg', caption: 'Photo clock gift' },
  { image: 'images/WhatsApp Image 2026-06-19 at 12.56.38 PM.jpeg', caption: 'Custom Couple pencil Sketch Portrait' },
  { image: 'images/magical-photo-frame-mirror-2-in-1-led-display-frame-with-smart-original-imah6zhqftzzkvtg.webp', caption: 'Magic mirror with name' },
  { image: 'images/WhatsApp Image 2026-06-21 at 11.53.58 AM.jpeg', caption: 'Custom pencil sketch portrait' },
  { image: 'images/WhatsApp Image 2026-06-21 at 11.53.11 AM.jpeg', caption: 'Hand-drawn couple sketch' },
  { image: 'images/WhatsApp Image 2026-06-21 at 12.04.47 PM.jpeg', caption: 'Blood art custom portrait' },
  { image: 'images/19a90817-b090-45c3-9a06-0e94c26f759e.jpg', caption: 'Personalized Photo Mug' },
  { image: 'images/0a57e01e-e331-4029-89b1-05efdfa7305e.jpg', caption: 'LED Best Couple wooden frame' },
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
  'Keychains': '🔑',
  'Wedding Gifts': '💒',
  'Bangles': '⭕',
  'Pencil Art': '✏️',
  'Blood Art': '🎨'
};
