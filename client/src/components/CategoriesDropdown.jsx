import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CategoriesDropdown = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

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
            setCategories(buildCategoryTree(data));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildCategoryTree = (cats) => {
        const map = {};
        const roots = [];

        cats.forEach(cat => {
            map[cat.id] = { ...cat, children: [] };
        });

        cats.forEach(cat => {
            if (cat.parent_id && map[cat.parent_id]) {
                map[cat.parent_id].children.push(map[cat.id]);
            } else {
                roots.push(map[cat.id]);
            }
        });

        return roots;
    };

    return (
        <div
            className="relative group z-50"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="text-white/60 hover:text-white text-[13px] font-medium transition-colors uppercase tracking-widest flex items-center gap-1 py-4">
                Categories
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Main Dropdown */}
            <div className={`absolute top-full left-0 w-64 bg-primary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-xs">Loading...</div>
                ) : categories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-xs">No categories found</div>
                ) : (
                    <ul className="flex flex-col">
                        {categories.map((category) => (
                            <CategoryItem key={category.id} category={category} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const CategoryItem = ({ category }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <li
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                to={`/category/${category.slug || category.id}`}
                className="flex items-center justify-between px-6 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
            >
                <span className="font-medium tracking-wide">{category.name}</span>
                {hasChildren && (
                    <span className="material-symbols-outlined text-[16px] text-gray-500 group-hover:text-white -rotate-90">expand_more</span>
                )}
            </Link>

            {/* Sub Menu */}
            {hasChildren && (
                <div className={`absolute top-0 left-full w-56 bg-primary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 ml-1 transition-all duration-200 origin-left ${isHovered ? 'opacity-100 scale-100 translate-x-0 visible' : 'opacity-0 scale-95 -translate-x-2 invisible'}`}>
                    <ul className="flex flex-col">
                        {category.children.map((child) => (
                            <li key={child.id}>
                                <Link
                                    to={`/category/${child.slug || child.id}`}
                                    className="block px-6 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    {child.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
};

export default CategoriesDropdown;
