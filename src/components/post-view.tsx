import { type RouterOutputs } from "@/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import Link from "next/link";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  return (
    <li
      key={props.post.id}
      className="flex items-center gap-4 border-b border-slate-400 p-8"
    >
      {/* <Image
        src={props.author.profilePicture ?? ""}
        alt="Profile Image"
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
      /> */}
      <div className="flex flex-col">
        <div className="flex gap-2">
          <Link href={`/@${props.author.username}`}>
            <span className="font-bold text-slate-300">{`@${props.author.username}`}</span>{" "}
          </Link>
          ·{" "}
        </div>
        <span>{props.post.content}</span>
      </div>
    </li>
  );
};
