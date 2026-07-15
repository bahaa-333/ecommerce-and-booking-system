import { Link } from "react-router-dom";

export default function CategoryCard({ businessType }) {
  return (
    <Link
      to={`/discover?type=${businessType.slug}`}
      className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: businessType.color }}
    >
      <span className="text-sm font-medium opacity-90">Browse</span>
      <span className="text-lg font-semibold leading-tight">{businessType.name}</span>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
    </Link>
  );
}
