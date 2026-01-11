import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';
import { analyticsService } from '../services/analyticsService';
import ProductDetailView from '../components/ProductDetailView';

const ProductPage = () => {
    const { id } = useParams();
    const { settings } = useStoreSettings();
    const [product, setProduct] = useState(null);
    const [variations, setVariations] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            window.scrollTo(0, 0);
            setLoading(true);
            try {
                let query = supabase.from('products').select('*');

                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                const isNumeric = /^\d+$/.test(id);

                if (isUuid || isNumeric) {
                    query = query.eq('id', id);
                } else {
                    query = query.eq('slug', id);
                }

                const { data, error } = await query.single();

                if (error) throw error;
                setProduct(data);

                const { data: varData } = await supabase
                    .from('product_variations')
                    .select('*')
                    .eq('product_id', data.id);

                setVariations(varData || []);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) return;
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .neq('id', product.id)
                    .eq('category', product.category)
                    .limit(4);
                if (error) throw error;
                setRelatedProducts(data || []);
            } catch (error) {
                console.error('Error fetching related products:', error);
            }
        };
        fetchRelatedProducts();
    }, [product, id]);

    useEffect(() => {
        if (product) {
            analyticsService.trackProductView(product);
        }
    }, [product]);

    if (loading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="size-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">Product Not Found</h1>
                <Link to="/shop" className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-primary hover:text-white transition-all">Back to Collection</Link>
            </div>
        );
    }

    const mainImage = product.images?.[0] || 'https://via.placeholder.com/600x800?text=No+Image';

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope']">
            <SEO
                title={product.name}
                description={product.description}
                image={mainImage}
                type="product"
                productData={{
                    name: product.name,
                    image: mainImage,
                    description: product.description,
                    price: product.is_sale ? product.sale_price : product.price,
                    currency: settings?.general?.currency || 'USD',
                    inStock: product.stock > 0
                }}
            />

            <ProductDetailView
                product={product}
                variations={variations}
                relatedProducts={relatedProducts}
                settingsOverride={settings.productPageSettings}
            />
        </div>
    );
};

export default ProductPage;
