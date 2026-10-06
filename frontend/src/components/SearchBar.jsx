export default function SearchBar({ onSearch, onCategoryChange, onSortChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
      <input type="text" placeholder="Search products..." onChange={(e) => onSearch(e.target.value)} className="flex-1 p-2 border rounded" />
      <select onChange={(e) => onCategoryChange(e.target.value)} className="p-2 border rounded bg-white">
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Fashion">Fashion</option>
        <option value="Books">Books</option>
        <option value="Home">Home</option>
      </select>
      <select onChange={(e) => onSortChange(e.target.value)} className="p-2 border rounded bg-white">
        <option value="">Sort By</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}
