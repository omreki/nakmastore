-- Add navigation_settings column to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS navigation_settings jsonb DEFAULT '[
    { "id": "shop", "label": "Shop", "path": "/shop", "type": "link", "visible": true },
    { "id": "men", "label": "Men", "path": "/men", "type": "link", "visible": true },
    { "id": "women", "label": "Women", "path": "/women", "type": "link", "visible": true },
    { "id": "accessories", "label": "Accessories", "path": "/accessories", "type": "link", "visible": true },
    { "id": "about", "label": "About", "path": "/about", "type": "link", "visible": true },
    { "id": "community", "label": "Community", "path": "/community", "type": "link", "visible": true },
    { "id": "contact", "label": "Contact", "path": "/contact", "type": "link", "visible": true }
]'::jsonb;
