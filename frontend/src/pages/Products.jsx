import { useEffect, useState } from 'react';
import api, { getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetched once: a failed call just leaves the dropdown at 'All Categories'
  useEffect(() => {
    getCategories().then(data => setCategories(data.categories)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        setProducts((await api.get(`/products?${params.toString()}`)).data.products);
      } catch { setError('Something went wrong while loading products.'); }
      finally { setLoading(false); }
    };
    const delayDebounceFn = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category, sort]);

  return (
    <div className="mt-6">
      <SearchBar categories={categories} onSearch={setSearch} onCategoryChange={setCategory} onSortChange={setSort} />
      {loading && <div className="text-center text-xl mt-10">Loading products...</div>}
      {error && <div className="text-center text-red-500 mt-10">{error}</div>}
      {!loading && !error && products.length === 0 && <div className="text-center text-gray-500 mt-10">No products found.</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(p => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}
