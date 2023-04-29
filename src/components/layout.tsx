import { type PropsWithChildren } from "react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen justify-center ">
      <div className="w-full border-x border-slate-400  md:max-w-2xl">
        {children}
      </div>
    </main>
  );
};
