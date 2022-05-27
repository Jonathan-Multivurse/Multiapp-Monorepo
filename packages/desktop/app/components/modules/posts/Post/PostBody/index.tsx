import { FC, ReactElement, useMemo, useState } from "react";
import { PostSummary } from "shared/graphql/fragments/post";
import Link from "next/link";
import { UserProfile } from "backend/graphql/users.graphql";
import { hrefFromLink, isWebLink, processPost } from "shared/src/patterns";
import LinkPreview from "../../LinkPreview";
import Media from "../../../../common/Media";

interface PostBodyProps {
  account: Pick<UserProfile, "_id"> | undefined;
  post: PostSummary;
}

const PostBody: FC<PostBodyProps> = ({ account, post }: PostBodyProps) => {
  const [previewLink, setPreviewLink] = useState<string>();
  const elements = useMemo(() => {
    if (!post.body) {
      return [<></>];
    }
    const splitBody = processPost(post.body);
    const _elements: (string | ReactElement)[] = [];
    let numLinks = 0;
    splitBody.map((text, index) => {
      if (text.startsWith("$")) {
        _elements.push(
          <Link
            key={`${text}-${index}`}
            href={`/search/posts?query=${text.slice(1)}`}
          >
            <a className="text-primary">{text}</a>
          </Link>
        );
      } else if (text.startsWith("#")) {
        _elements.push(
          <Link
            key={`${text}-${index}`}
            href={`/search/posts?query=${text.slice(1)}`}
          >
            <a className="text-primary">{text}</a>
          </Link>
        );
      } else if (text.startsWith("@") && text.includes("|")) {
        const [name, id] = text.split("|");
        _elements.push(
          <Link
            key={`${text}-${index}`}
            href={`/profile/${account?._id == id ? "me" : id}`}
          >
            <a className="text-primary">{name}</a>
          </Link>
        );
      } else if (text.startsWith("%%")) {
        const link = text.substring(2).trim();
        const href = hrefFromLink(link);
        if (isWebLink(href)) {
          numLinks++;
          if (numLinks == 1) {
            setPreviewLink(href);
          }
        }
        _elements.push(
          <Link href={href}>
            <a
              className="text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link}
            </a>
          </Link>
        );
      } else {
        _elements.push(text);
      }
    });
    return _elements;
  }, [account?._id, post.body]);
  return (
    <>
      <div className="px-4">
        <div className="text-sm text-white opacity-90 whitespace-pre-wrap break-all">
          {elements.map((element, index) => (
            <span key={index}>{element}</span>
          ))}
        </div>
        {previewLink && !post.media && (
          <div className="my-4">
            <LinkPreview link={previewLink} size="lg" />
          </div>
        )}
      </div>
      {post.media && (
        <div className="relative h-auto mt-5 border-b border-white/[.12]">
          <Media media={post.media} />
        </div>
      )}
      <div className="uppercase text-xs text-white font-medium opacity-60 mt-3 px-4">
        {post.categories.join(" • ")}
      </div>
    </>
  );
};

export default PostBody;
