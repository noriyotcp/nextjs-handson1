import dayjs from "dayjs";
import Link from "next/link";
import { FunctionComponent } from "react";
import { Post } from "../../../pages";
import styles from "./index.module.css";
import CodeComponent from "../Code";

export const PostComponent: FunctionComponent<{
  post: Post;
}> = ({ post }: { post: Post }) => {
  return (
    <div className={styles.post} key={post.id}>
      <h1 className={styles.title}>
        <Link href={`/post/${encodeURIComponent(post.slug ?? "")}`}>
          {post.title}
        </Link>
      </h1>
      <div className={styles.timestampWrapper}>
        <div>
          <div className={styles.timestamp}>
            作成日時: {dayjs(post.createdTs).format("YYYY-MM-DD HH:mm:ss")}
          </div>
          <div className={styles.timestamp}>
            更新日時: {dayjs(post.lastEditedTs).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        </div>
      </div>
      <div>
        {post.contents.map((content, index) => {
          const key = `${post.id}_${index}`;

          switch (content.type) {
            case "heading_2":
              return (
                <h2 className={styles.heading2} key={key}>
                  {content.text}
                </h2>
              );
            case "heading_3":
              return (
                <h3 className={styles.heading3} key={key}>
                  {content.text}
                </h3>
              );
            case "paragraph":
              return (
                <p className={styles.paragraph} key={key}>
                  {content.text}
                </p>
              );
            case "code":
              return (
                <CodeComponent
                  language={content.language}
                  text={content.text}
                  key={key}
                />
              );
            case "quote":
              return (
                <blockquote className={styles.quote} key={key}>
                  {content.text}
                </blockquote>
              );
          }
        })}
      </div>
    </div>
  );
};
