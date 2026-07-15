import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Minus, Package, Plus } from "lucide-react";
import { apiGet } from "../../lib/api";
import { useCart } from "../../lib/CartContext";

export default function ProductDetail() {
  const { tenant } = useOutletContext();
  const { productId } = useParams();
  const color = tenant.business_type?.color ?? "#f5a623";
  const cart = useCart(tenant.slug);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedValues, setSelectedValues] = useState({});
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiGet(`tenants/${tenant.slug}/products/${productId}`, { signal: controller.signal })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant.slug, productId]);

  const selectedVariant = useMemo(() => {
    if (!product?.has_variants) return null;
    const optionIds = product.options.map((o) => o.id);
    if (optionIds.some((id) => !selectedValues[id])) return null;

    return product.variants.find((variant) => {
      const variantValueIds = variant.option_values.map((v) => v.id);
      return optionIds.every((optionId) => variantValueIds.includes(selectedValues[optionId]));
    });
  }, [product, selectedValues]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading…</div>;
  }

  if (!product) {
    return <div className="py-24 text-center text-sm text-gray-400">Product not found.</div>;
  }

  const images = (selectedVariant?.images?.length ? selectedVariant.images : product.images) ?? [];
  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const canAdd = !product.has_variants || Boolean(selectedVariant);
  const outOfStock = stock !== null && stock !== undefined && stock <= 0;

  function handleAddToCart() {
    cart.addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity,
      name: product.name + (selectedVariant?.description ? ` (${selectedVariant.description})` : ""),
      price: Number(price),
      image: images[0]?.url ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
          {images[activeImage] ? (
            <img src={images[activeImage].url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-gray-300" />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((image, i) => (
              <button
                key={image.id ?? i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                  activeImage === i ? "border-gray-900" : "border-transparent"
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
        <div className="mt-2 text-xl font-semibold" style={{ color }}>
          ${Number(price).toFixed(2)}
        </div>

        {product.description && <p className="mt-4 text-sm leading-relaxed text-gray-500">{product.description}</p>}

        {product.options?.map((option) => (
          <div key={option.id} className="mt-6">
            <div className="text-sm font-medium text-gray-900">{option.name}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {option.values.map((value) => (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelectedValues((prev) => ({ ...prev, [option.id]: value.id }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    selectedValues[option.id] === value.id
                      ? "border-transparent text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                  style={selectedValues[option.id] === value.id ? { backgroundColor: color } : undefined}
                >
                  {value.value}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-gray-200">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5 text-gray-500 hover:text-gray-800"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2.5 text-gray-500 hover:text-gray-800"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={!canAdd || outOfStock}
            onClick={handleAddToCart}
            className="flex-1 rounded-full py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {outOfStock ? "Out of stock" : added ? "Added to cart" : "Add to Cart"}
          </button>
        </div>

        {product.has_variants && !selectedVariant && (
          <p className="mt-3 text-xs text-gray-400">Select {product.options?.length > 1 ? "options" : "an option"} to continue.</p>
        )}
      </div>
    </div>
  );
}
