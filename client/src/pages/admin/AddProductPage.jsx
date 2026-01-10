import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import ProductVariationManager from '../../components/admin/ProductVariationManager';

const AddProductPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const { notify } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        sale_price: '',
        description: '',
        is_new: false,
        is_sale: false,
        stock: 0,
        features: '',
        colors: [],
        sizes: [],
        sku: '' // Added base SKU
    });

    const [variations, setVariations] = useState([]); // Added variations state

    const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
    const [categorySearch, setCategorySearch] = useState('');

    const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);

            // Set default category if available
            if (data && data.length > 0) {
                const firstParent = data.find(c => !c.parent_id);
                if (firstParent) {
                    setFormData(prev => ({ ...prev, category: firstParent.slug }));
                    setSelectedCategoryIds(new Set([String(firstParent.id)]));
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        // No specific side-effect needed for categories as we use a Set now
    }, [categories]);

    const toggleCategory = (categoryId) => {
        const id = String(categoryId);
        const newSelected = new Set(selectedCategoryIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCategoryIds(newSelected);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Automatically deactivate sale if price is removed
            if (name === 'price' && !value) {
                newState.is_sale = false;
            }

            return newState;
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setImages(prev => [...prev, ...files]);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const setAsFeatured = (index) => {
        if (index === 0) return;

        setImages(prev => {
            const newArray = [...prev];
            const [item] = newArray.splice(index, 1);
            newArray.unshift(item);
            return newArray;
        });

        setImagePreviews(prev => {
            const newArray = [...prev];
            const [item] = newArray.splice(index, 1);
            newArray.unshift(item);
            return newArray;
        });
    };

    const addColor = () => {
        if (newColor.name && newColor.hex) {
            setFormData(prev => ({
                ...prev,
                colors: [...prev.colors, { ...newColor }]
            }));
            setNewColor({ name: '', hex: '#000000' });
        }
    };

    const removeColor = (index) => {
        setFormData(prev => ({
            ...prev,
            colors: prev.colors.filter((_, i) => i !== index)
        }));
    };

    const toggleSize = (size) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const uploadImages = async () => {
        const uploadedUrls = [];

        for (const file of images) {
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (error) {
                console.error('Error uploading image:', error);
                continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploading(true);

        try {
            // 1. Upload Images
            let imageUrls = [];
            if (images.length > 0) {
                imageUrls = await uploadImages();
                if (imageUrls.length === 0 && images.length > 0) {
                    throw new Error('Image upload failed. Please try again.');
                }
            }

            // 2. Prepare Data
            const price = parseFloat(formData.price);
            const sale_price = formData.is_sale ? parseFloat(formData.sale_price) : null;

            // Derive total stock from variations if they exist, otherwise use manual stock
            const totalStock = variations.length > 0
                ? variations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
                : parseInt(formData.stock);

            if (isNaN(price)) throw new Error('Invalid price value.');
            if (formData.is_sale && isNaN(sale_price)) throw new Error('Invalid sale price value.');

            // derive legacy category strings from selection for backward compatibility
            const selectedCatsList = categories.filter(c => selectedCategoryIds.has(String(c.id)));
            const primaryCat = selectedCatsList.find(c => !c.parent_id) || selectedCatsList[0];
            const subCat = selectedCatsList.find(c => c.parent_id) || null;

            const productData = {
                name: formData.name,
                slug: `${formData.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`,
                price: price,
                sale_price: sale_price,
                description: formData.description,
                category: primaryCat ? primaryCat.slug : 'uncategorized', // Legacy field
                sub_category: subCat ? subCat.slug : null, // Legacy field
                is_new: formData.is_new,
                is_sale: formData.is_sale,
                stock: totalStock,
                sku: formData.sku?.trim() || null,
                images: imageUrls,
                colors: formData.colors.length > 0 ? formData.colors : [{ name: 'Black', hex: '#000000' }],
                sizes: formData.sizes.length > 0 ? formData.sizes : ['S', 'M', 'L', 'XL'],
                rating: 0,
                reviews_count: 0,
                created_at: new Date().toISOString()
            };

            // 3. Insert Product into Supabase
            const { data: productDataResult, error: productError } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (productError) throw productError;

            // 4. Insert Variations if any
            if (variations.length > 0) {
                const mainSku = formData.sku?.trim();
                const varSkus = variations
                    .map(v => v.sku?.trim())
                    .filter(sku => sku && sku !== '');

                const uniqueSkus = new Set(varSkus);
                if (varSkus.length !== uniqueSkus.size) {
                    throw new Error('Duplicate SKUs detected within the variations matrix. Each variation must have a unique SKU.');
                }

                if (mainSku && uniqueSkus.has(mainSku)) {
                    throw new Error(`The main product SKU "${mainSku}" is already assigned to a variation. Each SKU must be globally unique.`);
                }

                const variationInserts = variations.map(v => ({
                    product_id: productDataResult.id,
                    name: v.name,
                    color: v.color,
                    size: v.size,
                    sku: v.sku?.trim() || null,
                    price: parseFloat(v.price) || price,
                    stock: parseInt(v.stock) || 0
                }));

                const { error: varInsError } = await supabase
                    .from('product_variations')
                    .insert(variationInserts);

                if (varInsError) throw new Error('Failed to add product variations. ' + varInsError.message);
            }

            // 5. Insert Product Categories
            if (selectedCategoryIds.size > 0) {
                const categoryInserts = Array.from(selectedCategoryIds).map(catId => ({
                    product_id: productDataResult.id,
                    category_id: catId
                }));

                const { error: catError } = await supabase
                    .from('product_categories')
                    .insert(categoryInserts);

                if (catError) {
                    console.error('Error linking categories:', catError);
                    throw new Error('Failed to associate categories with new product. ' + catError.message);
                }
            }

            console.log('Product created successfully:', productDataResult);

            notify('Product successfully added to the collection.', 'success');

            // 4. Redirect after delay
            setTimeout(() => {
                navigate('/admin/products');
            }, 2000);

        } catch (error) {
            console.error('Error creating product:', error);
            notify(`Error: ${error.message || 'Failed to save product details.'}`, 'error');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Collection Management
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ New Product</span>
                        </div>
                        <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Add New <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Product</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium leading-relaxed max-w-2xl mt-2">
                            Define the heritage, craftsmanship, and visual presentation for your new collection piece.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/admin/products" className="hidden md:flex items-center justify-center rounded-xl h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white gap-2 text-[10px] font-black uppercase tracking-widest px-6 transition-all border border-white/10 group">
                            Cancel Creation
                        </Link>
                    </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Primary Data Column */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} id="add-product-form" className="flex flex-col gap-8">
                            {/* Entity Metadata Card */}
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>

                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">description</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Product Details</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Core Information & Pricing</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Product Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                            placeholder="e.g. African Print Silk Shirt"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Product SKU</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                            placeholder="SKU-BASE001"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Regular Price ($)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            step="0.01"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-black h-14 px-6 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className={`flex flex-col gap-2.5 transition-all duration-500 ${formData.is_sale ? 'opacity-100 translate-y-0' : 'opacity-20 pointer-events-none md:translate-y-2'}`}>
                                        <label className="text-[#b82063] text-[10px] font-black tracking-[0.2em] uppercase ml-1">Sale Price ($)</label>
                                        <input
                                            type="number"
                                            name="sale_price"
                                            step="0.01"
                                            value={formData.sale_price}
                                            onChange={handleInputChange}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-[#b82063]/20 text-[#b82063] font-black h-14 px-6 text-sm transition-all outline-none focus:ring-1 focus:ring-[#b82063]/40 focus:bg-black/60 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5 mt-8 relative z-10">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Product Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="6"
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-gray-300 font-medium p-6 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 resize-none leading-relaxed"
                                        placeholder="Describe the product features, fit, and material specification..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Selection Base Card */}
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">palette</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Style & Size Options</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Available variations for the collection</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                    {/* Sizing Subsection */}
                                    <div className="flex flex-col gap-6">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Available Sizes</label>
                                        <div className="flex flex-wrap gap-3">
                                            {availableSizes.map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => toggleSize(size)}
                                                    className={`px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${formData.sizes.includes(size) ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(48, 19, 106,0.3)]' : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Aesthetic Options Subsection */}
                                    <div className="flex flex-col gap-6">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Color Palette</label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-wrap gap-3">
                                                {formData.colors.map((color, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-full pl-1.5 pr-3 py-1.5 group hover:border-red-500/30 transition-all">
                                                        <div className="size-5 rounded-full border border-white/10" style={{ backgroundColor: color.hex }}></div>
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{color.name}</span>
                                                        <button type="button" onClick={() => removeColor(idx)} className="ml-1 text-gray-500 hover:text-red-500 transition-colors">
                                                            <span className="material-symbols-outlined">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Color Name"
                                                    value={newColor.name}
                                                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                                                    className="glossy-input flex-1 rounded-xl bg-black/40 border-white/5 text-white font-bold h-11 px-4 text-[10px] outline-none"
                                                />
                                                <input
                                                    type="color"
                                                    value={newColor.hex}
                                                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                                                    className="size-11 rounded-xl bg-black/40 border border-white/5 p-1 cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addColor}
                                                    className="size-11 rounded-xl bg-white/5 hover:bg-primary text-white flex items-center justify-center transition-all border border-white/5"
                                                >
                                                    <span className="material-symbols-outlined">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Variations Grid */}
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">grid_view</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Product Variations</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">SKU, Price & Stock Per Variant</p>
                                    </div>
                                </div>

                                <ProductVariationManager
                                    colors={formData.colors}
                                    sizes={formData.sizes}
                                    variations={variations}
                                    basePrice={formData.price}
                                    onChange={setVariations}
                                />
                            </div>

                            {/* Taxonomy & Tags Card */}
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">category</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Classification</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Categories & Display Settings</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="md:col-span-2 flex flex-col gap-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase">Product Category</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search categories..."
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] text-white outline-none focus:border-primary/50 w-40 transition-all"
                                                />
                                                <span className="material-symbols-outlined text-[14px] absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                                            </div>
                                        </div>
                                        <div className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 p-6 min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                            {categories.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <span className="material-symbols-outlined text-4xl mb-2">category</span>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-center">No categories found.<br /><Link to="/admin/categories" className="text-primary-light hover:underline mt-2 inline-block">Create one here</Link></p>
                                                </div>
                                            ) : categories.filter(c =>
                                                c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                                (c.parent_id && categories.find(p => String(p.id) === String(c.parent_id))?.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                            ).length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-center">No categories match your search.</p>
                                                </div>
                                            ) : categories.filter(c => !c.parent_id).map(parent => {
                                                const subcategories = categories.filter(sub => sub.parent_id === parent.id);
                                                const matchesSearch = parent.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                                    subcategories.some(s => s.name.toLowerCase().includes(categorySearch.toLowerCase()));

                                                if (!matchesSearch && categorySearch) return null;

                                                return (
                                                    <div key={parent.id} className="flex flex-col gap-3">
                                                        <label className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded-lg hover:bg-white/5 transition-all">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCategoryIds.has(String(parent.id))}
                                                                onChange={() => toggleCategory(parent.id)}
                                                                className="peer absolute inset-0 opacity-0 cursor-pointer z-20"
                                                            />
                                                            <div className="size-5 rounded border-2 border-white/20 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center shadow-lg">
                                                                <span className="material-symbols-outlined text-[14px] text-white opacity-0 peer-checked:opacity-100 font-bold">check</span>
                                                            </div>
                                                            <span className="text-sm font-black text-gray-300 group-hover:text-white transition-colors tracking-tight">{parent.name}</span>
                                                        </label>

                                                        {/* Subcategories */}
                                                        <div className="ml-8 flex flex-col gap-2.5 pl-4 border-l border-white/10">
                                                            {subcategories.map(sub => {
                                                                const subMatches = sub.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                                                    parent.name.toLowerCase().includes(categorySearch.toLowerCase());
                                                                if (!subMatches && categorySearch) return null;

                                                                return (
                                                                    <label key={sub.id} className="flex items-center gap-3 cursor-pointer group py-0.5 relative">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedCategoryIds.has(String(sub.id))}
                                                                            onChange={() => toggleCategory(sub.id)}
                                                                            className="peer absolute inset-0 opacity-0 cursor-pointer z-20"
                                                                        />
                                                                        <div className="size-4 rounded border border-white/20 peer-checked:bg-primary/80 peer-checked:border-primary/80 transition-all flex items-center justify-center">
                                                                            <span className="material-symbols-outlined text-[11px] text-white opacity-0 peer-checked:opacity-100">check</span>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300 transition-colors">{sub.name}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Total Stock</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            required
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-black h-14 px-6 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 font-mono"
                                            placeholder="100"
                                        />
                                        <p className="text-[8px] text-gray-500 italic mt-1 font-bold">Note: If variations are defined, this will be automatically calculated as the sum of all variant stock.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-8 mt-10 relative z-10 pt-6 border-t border-white/[0.03]">
                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="is_new"
                                                checked={formData.is_new}
                                                onChange={handleInputChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 rounded-full bg-gray-800 transition-colors duration-300 peer-checked:bg-primary/40 shadow-inner ring-1 ring-white/5"></div>
                                            <div className="absolute top-1 left-1 size-4 bg-white rounded-full transition-all duration-300 peer-checked:left-7 shadow-xl"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">NEW ARRIVAL</span>
                                    </label>

                                    <label className={`flex items-center gap-4 cursor-pointer group transition-all duration-300 ${!formData.price ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:opacity-100'}`}>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="is_sale"
                                                disabled={!formData.price}
                                                checked={formData.is_sale}
                                                onChange={handleInputChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 rounded-full bg-gray-800 transition-colors duration-300 peer-checked:bg-primary/40 shadow-inner ring-1 ring-white/5"></div>
                                            <div className="absolute top-1 left-1 size-4 bg-white rounded-full transition-all duration-300 peer-checked:left-7 shadow-xl"></div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!formData.price ? 'text-gray-700' : 'text-gray-500 group-hover:text-white'}`}>
                                            {formData.price ? 'MARK AS SALE' : 'ENTER PRICE TO ACTIVATE SALE'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Visual Assets Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Asset Injection Card */}
                        <div className="glossy-panel rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-11 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[22px]">add_a_photo</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-sm tracking-tight uppercase tracking-widest text-xs">Product Images</h4>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Visual Presentation</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-6">
                                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/40 transition-all cursor-pointer relative group bg-black/30 shadow-inner">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    />
                                    <div className="size-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:text-primary-light transition-all shadow-xl group-hover:rotate-12">
                                        <span className="material-symbols-outlined text-[32px]">upload_file</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">Upload Photos</p>
                                        <p className="text-[8px] text-gray-700 font-bold uppercase tracking-tighter mt-1">MAX 10MB // PNG or JPG</p>
                                    </div>
                                </div>

                                {imagePreviews.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                                        {imagePreviews.map((src, idx) => (
                                            <div key={idx} className={`relative aspect-square rounded-2xl overflow-hidden group border transition-all duration-300 shadow-xl ring-1 ring-white/5 animate-fade-in-up ${idx === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-white/10'}`}>
                                                <img src={src} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                                                    {idx !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAsFeatured(idx)}
                                                            className="px-3 py-1.5 rounded-lg bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                                                        >
                                                            Set Featured
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all transform translate-y-2 group-hover:translate-y-0"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>

                                                {/* Featured Badge */}
                                                {idx === 0 && (
                                                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary text-white text-[8px] font-black uppercase tracking-widest shadow-lg">
                                                        Featured
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 border border-white/5 rounded-3xl bg-black/10">
                                        <span className="material-symbols-outlined text-[48px] text-gray-700">image_not_supported</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Images</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 mt-auto">
                                <button
                                    form="add-product-form"
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full group h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] admin-button-primary shadow-2xl transition-all duration-500 hover:-translate-y-1 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${loading ? 'cursor-wait' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin size-4 border-2 border-black/20 border-t-black group-hover:border-white/20 group-hover:border-t-white rounded-full"></span>
                                            {uploading ? 'UPLOADING...' : 'SAVING...'}
                                        </>
                                    ) : (
                                        <>
                                            Add Product
                                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform duration-300">check</span>
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>
                    </div>
                </div>

                {/* System Registry Footer Meta */}
                <div className="flex items-center justify-center px-2 pt-12 border-t border-white/5 mt-auto opacity-40">
                    <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em] flex items-center gap-4">
                        NAKMA STORE ADMIN
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse {
                    animation: pulse 2s infinite;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
            `}</style>
        </AdminLayout>
    );
};

export default AddProductPage;
