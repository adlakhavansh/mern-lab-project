export default function SearchBar({ categories, onSearch, onCategoryChange, onSortChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
      <label className="sr-only" htmlFor="product-search">Search products</label>
      <input
        id="product-search"
        type="search"
        placeholder="Search products..."
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="sr-only" htmlFor="category-filter">Filter by category</label>
      <select
        id="category-filter"
        onChange={(e) => onCategoryChange(e.target.value)}
        className="p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Categories</option>
        {/* Comes from the database, so a new category needs no code change */}
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>

      <label className="sr-only" htmlFor="sort-order">Sort products</label>
      <select
        id="sort-order"
        onChange={(e) => onSortChange(e.target.value)}
        className="p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Sort By</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}
