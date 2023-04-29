import { type PropsWithChildren } from "react";

export const Layout = (props: PropsWithChildren) => {
  return (
    <main className="flex min-h-screen justify-center ">
      <div className="w-full border-x border-slate-400  md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};
