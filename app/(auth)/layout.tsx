export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="grid min-h-dvh place-items-center bg-[#f8f7ff] px-5 py-10">{children}</main>
}
