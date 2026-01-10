ALTER TABLE store_settings
ADD COLUMN homepage_settings JSONB DEFAULT '{
  "hero": {
    "subHeadline": "Collection 01",
    "headlineLine1": "PRECISION",
    "headlineLine2": "APPAREL.",
    "descriptionLine1": "High-performance engineered wear.",
    "descriptionLine2": "Designed for the relentless mind. Built for the elite body.",
    "imageUrl": "/hero-clothes-bg.png"
  },
  "philosophy": {
    "subHeadline": "The Noesis Philosophy",
    "quote": "The right gear is the catalyst for your next breakthrough.",
    "descriptionLine1": "Engineered for the relentless individual.",
    "descriptionLine2": "Designed to transcend the boundaries of performance and aesthetic.",
    "imageUrl": "/philosophy-bg.png"
  },
  "categories": {
    "men": {
      "title": "Men",
      "subtitle": "Engineered Apparel",
      "imageUrl": "/men-category.png"
    },
    "women": {
      "title": "Women",
      "subtitle": "Sculpted Fit",
      "imageUrl": "/women-category.png"
    }
  }
}'::jsonb;
