import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { type RouterOutputs, api } from "@/utils/api";
import Image from "next/image";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex w-full gap-4">
      <Image
        src={user.profileImageUrl}
        alt="Profile Image"
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
      />
      <input placeholder="Type some emojis!" className="grow bg-transparent" />
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  return (
    <li
      key={props.post.id}
      className="flex items-center gap-4 border-b border-slate-400 p-8"
    >
      <Image
        src={props.author.profilePicture}
        alt="Profile Image"
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
      />
      <div className="flex flex-col">
        <div className="flex gap-2">
          <span className="font-bold text-slate-300">{`@${props.author.username}`}</span>{" "}
          ·{" "}
          <span className="text-slate-300">
            {dayjs(props.post.createdAt).fromNow()}
          </span>
        </div>
        <span>{props.post.content}</span>
      </div>
    </li>
  );
};

const Home: NextPage = () => {
  const user = useUser();

  const { data, isLoading, isError, error } = api.posts.getAll.useQuery();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center ">
        <div className="w-full border-x border-slate-400  md:max-w-2xl">
          {" "}
          <div className="j flex border-b border-slate-400 p-4">
            {user.isSignedIn ? (
              <CreatePostWizard />
            ) : (
              <SignInButton>Login</SignInButton>
            )}
          </div>
          {data.length > 0 ? (
            <ul className="flex flex-col">
              {data.map((item) => (
                <PostView key={item.post.id} {...item} />
              ))}
            </ul>
          ) : (
            <p>No posts yet</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
