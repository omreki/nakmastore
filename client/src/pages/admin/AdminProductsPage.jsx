import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';

const AdminProductsPage = () => {
    const { formatPrice } = useStoreSettings();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0
    });
    const { notify, confirm } = useNotification();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);

            setStats({
                totalProducts: data.length,
                lowStock: data.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0).length,
                outOfStock: data.filter(p => (p.stock || 0) === 0).length
            });

        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = async (productId, productName) => {
        const confirmed = await confirm({
            title: 'Confirm Purge',
            message: `You are about to permanently remove "${productName}" from the global registry. This action cannot be reversed.`,
            confirmLabel: 'Permanently Delete',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            notify('PURGE_SUCCESS: Product entity removed from registry.', 'success');
            fetchProducts();

        } catch (error) {
            console.error('Error deleting product:', error);
            notify(`PURGE_FAILURE: ${error.message || 'Operation failed.'}`, 'error');
        }
    };

    const toggleProductStatus = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_draft: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchProducts();
        } catch (error) {
            console.error('Error toggling product status:', error);
            notify(`SYNC_FAILURE: ${error.message || 'Failed to update product state.'}`, 'error');
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Inventory Nodes
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Product Registry</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Architect, curate, and optimize your global stock distribution.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="hidden md:flex items-center justify-center rounded-xl h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white gap-2 text-[10px] font-black uppercase tracking-widest px-6 transition-all border border-white/10 group">
                            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">file_download</span>
                            Export Data
                        </button>
                        <Link to="/admin/products/new" className="group flex items-center justify-center overflow-hidden rounded-xl h-12 bg-white text-black hover:bg-primary-hover hover:text-white gap-2 text-[10px] font-black uppercase tracking-widest px-6 transition-all shadow-2xl hover:-translate-y-0.5 transform active:scale-95 border border-white/10">
                            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">add</span>
                            <span>Add Product</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glossy-panel rounded-[1.5rem] p-6 flex items-start justify-between border border-white/5 hover:border-white/10 transition-colors bg-black/20">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Inventory</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{stats.totalProducts}</h3>
                            <p className="text-green-500 text-[9px] font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                +12% Efficiency
                            </p>
                        </div>
                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    </div>
                    <div className="glossy-panel rounded-[1.5rem] p-6 flex items-start justify-between border border-white/5 hover:border-white/10 transition-colors bg-black/20">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Low Stock Pulse</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{stats.lowStock}</h3>
                            <p className="text-orange-400 text-[9px] font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                Critical Delta
                            </p>
                        </div>
                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-orange-400 border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined">low_priority</span>
                        </div>
                    </div>
                    <div className="glossy-panel rounded-[1.5rem] p-6 flex items-start justify-between border border-white/5 hover:border-white/10 transition-colors bg-black/20">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Out of Stock</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{stats.outOfStock}</h3>
                            <p className="text-red-500 text-[9px] font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm">error</span>
                                RESTOCK_REQD
                            </p>
                        </div>
                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-red-500 border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined">block</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="glossy-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/5 bg-black/40 shadow-xl">
                    <div className="relative w-full md:w-96 group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px] group-focus-within:text-white transition-colors">search</span>
                        <input className="glossy-input w-full rounded-xl pl-11 pr-4 h-11 text-sm outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-600 bg-black/40 text-white" placeholder="Search products, SKU, category..." type="text" />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scroll-touch">
                        <button className="whitespace-nowrap flex items-center gap-2 px-4 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-300 transition-colors border border-white/5">
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            Filters
                        </button>
                        <div className="h-11 w-px bg-white/10 mx-1"></div>
                        <select className="h-11 bg-transparent text-sm font-bold text-gray-300 outline-none cursor-pointer hover:text-white px-2">
                            <option className="bg-[#1a1a1a]">Category: All</option>
                            <option className="bg-[#1a1a1a]">Men</option>
                            <option className="bg-[#1a1a1a]">Women</option>
                            <option className="bg-[#1a1a1a]">Accessories</option>
                        </select>
                        <select className="h-11 bg-transparent text-sm font-bold text-gray-300 outline-none cursor-pointer hover:text-white px-2">
                            <option className="bg-[#1a1a1a]">Status: All</option>
                            <option className="bg-[#1a1a1a]">Active</option>
                            <option className="bg-[#1a1a1a]">Draft</option>
                            <option className="bg-[#1a1a1a]">Archived</option>
                        </select>
                    </div>
                </div>

                {/* Table container */}
                <div className="glossy-panel rounded-[2rem] overflow-hidden flex flex-col relative border border-white/5 bg-black/40 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
                                    <th className="p-5 pl-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <input className="rounded border-gray-600 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0" type="checkbox" />
                                            <span>Product Entity</span>
                                        </div>
                                    </th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Taxonomy</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Registry State</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Valuation</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">In Stock</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right pr-8">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                                <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                                                <span className="font-bold tracking-widest text-[10px] uppercase">Loading inventory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <span className="material-symbols-outlined text-4xl opacity-20">inventory_2</span>
                                                <span className="font-medium tracking-wide">No products found in your inventory.</span>
                                                <Link to="/admin/products/new" className="text-primary-light hover:text-primary transition-colors text-xs font-bold uppercase mt-2">Add your first product</Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="group hover:bg-white/[0.03] transition-colors relative">
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <input className="rounded border-gray-600 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0" type="checkbox" />
                                                    <div className="size-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                        {product.images && product.images.length > 0 ? (
                                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-600">checkroom</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-white group-hover:text-primary-light transition-colors truncate">{product.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">SKU: {product.slug?.substring(0, 8).toUpperCase() || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-gray-400 font-bold text-xs uppercase tracking-tight group-hover:text-white transition-colors">{product.category || 'Uncategorized'}</span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleProductStatus(product.id, product.is_draft)}
                                                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-1 ring-white/10 ${product.is_draft ? 'bg-white/5' : 'bg-green-500/40'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.is_draft ? 'translate-x-0' : 'translate-x-5'}`}></span>
                                                    </button>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${product.is_draft
                                                        ? 'bg-yellow-400/10 text-yellow-500 ring-yellow-400/20'
                                                        : 'bg-green-400/10 text-green-400 ring-green-400/20'
                                                        }`}>
                                                        {product.is_draft ? 'Hidden' : 'Live'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-white text-base">{formatPrice(product.price)}</td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1.5 w-24">
                                                    <div className="flex justify-between items-center px-0.5">
                                                        <span className="text-white font-black text-xs">{product.stock || 120}</span>
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Units</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                        <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: '80%' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right pr-8">
                                                <div className="flex items-center justify-end gap-2 transition-all duration-300">
                                                    <Link to={`/admin/products/edit/${product.id}`} className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10" title="Edit">
                                                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
                                                        className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/10"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 bg-white/[0.01] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Showing <span className="text-white font-black">1-{products.length}</span> of <span className="text-white font-black">{stats.totalProducts}</span> Items
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="size-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed group">
                                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
                            </button>
                            <button className="size-9 rounded-xl flex items-center justify-center bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 ring-1 ring-white/10">1</button>
                            <button className="size-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 font-bold text-sm">2</button>
                            <button className="size-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 font-bold text-sm">3</button>
                            <span className="text-gray-600 px-1 font-black">...</span>
                            <button className="size-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 font-bold text-sm">12</button>
                            <button className="size-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 group">
                                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between px-2 pt-4">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">System Version 2.4.0 • Build ID: NOE-PROD-922</p>
                    <div className="flex gap-6">
                        <a className="text-[10px] text-gray-600 hover:text-white transition-colors font-bold uppercase tracking-widest" href="#">Support Desk</a>
                        <a className="text-[10px] text-gray-600 hover:text-white transition-colors font-bold uppercase tracking-widest" href="#">Access Log</a>
                    </div>
                </div>
            </div>



            <style jsx>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </AdminLayout>
    );
};

export default AdminProductsPage;
