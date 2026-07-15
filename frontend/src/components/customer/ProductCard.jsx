import { Link } from "react-router-dom";
import { Package } from "lucide-react";

export default function ProductCard({ product, tenantSlug, color = "#f5a623" }) {
  const image = product.images?.[0]?.url;

  return (
    <Link
      to={`/store/${tenantSlug}/products/${product.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-gray-50">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-8 w-8 text-gray-300" />
        )}
      </div>
      <div className="p-4">
        <div className="font-medium text-gray-900">{product.name}</div>
        <div className="mt-1 text-sm font-semibold" style={{ color }}>
          ${Number(product.price).toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
