import ImageCarousel from "./ImageCarousel";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full">
      <div className="relative flex h-dvh flex-col overflow-hidden md:hidden">
        <div className="absolute inset-0">
          <ImageCarousel className="h-full w-full" offsetY={120} />
        </div>
        <div className="relative z-10 mt-auto max-h-full overflow-y-auto rounded-t-3xl bg-white px-6 pt-8 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="hidden min-h-screen w-full items-center justify-center bg-[#11291b] p-6 md:flex">
        <div className="grid w-full max-w-5xl grid-cols-2 overflow-hidden rounded-[32px] bg-white shadow-2xl md:min-h-[600px]">
          <div className="flex max-h-[85vh] flex-col justify-center overflow-y-auto px-14 py-12">
            <div className="mx-auto w-full max-w-sm">{children}</div>
          </div>
          <div className="p-3">
            <ImageCarousel className="h-full w-full rounded-[24px]" />
          </div>
        </div>
      </div>
    </div>
  );
}