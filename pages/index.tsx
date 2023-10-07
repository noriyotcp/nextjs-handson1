import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { GetStaticProps, NextPage } from "next";
import styles from "../styles/Home.module.css";
import dayjs from "dayjs";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export type Content =
  | {
      type: "paragraph" | "quote" | "heading_2" | "heading_3";
      text: string | null;
    }
  | {
      type: "code";
      text: string | null;
      language: string | null;
    };

export type Post = {
  id: string;
  title: string | null;
  slug: string | null;
  createdTs: string | null;
  lastEditedTs: string | null;
  content: Content[];
};

type StaticProps = {
  post: Post | null;
};

export const getStaticProps: GetStaticProps<StaticProps> = async () => {
  const database = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID || "",
    filter: {
      and: [
        {
          property: "Published",
          checkbox: {
            equals: true,
          },
        },
      ],
    },
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });
  const page = database.results[0];
  if (!page) {
    return {
      props: {
        post: null,
      },
    };
  }
  if (!("properties" in page)) {
    return {
      props: {
        post: {
          id: page.id,
          title: null,
          slug: null,
          createdTs: null,
          lastEditedTs: null,
          content: [],
        },
      },
    };
  }
  let title: string | null = null;
  if (page.properties["Name"].type === "title") {
    const titleRes = page.properties["Name"].title as RichTextItemResponse[];
    title = titleRes[0]?.plain_text ?? null;
  }
  let slug: string | null = null;
  if (page.properties["Slug"].type === "rich_text") {
    const slugRes = page.properties["Slug"].rich_text as RichTextItemResponse[];
    slug = slugRes[0]?.plain_text ?? null;
  }

  const blocks = await notion.blocks.children.list({
    block_id: page.id,
  });
  const contents: Content[] = [];
  blocks.results.forEach((block) => {
    if (!("type" in block)) {
      return;
    }
    switch (block.type) {
      case "paragraph":
        contents.push({
          type: "paragraph",
          text: block.paragraph?.rich_text[0]?.plain_text ?? null,
        });
        break;
      case "heading_2":
        contents.push({
          type: "heading_2",
          text: block.heading_2?.rich_text[0]?.plain_text ?? null,
        });
        break;
      case "heading_3":
        contents.push({
          type: "heading_3",
          text: block.heading_3?.rich_text[0]?.plain_text ?? null,
        });
        break;
      case "quote":
        contents.push({
          type: "quote",
          text: block.quote?.rich_text[0]?.plain_text ?? null,
        });
        break;
      case "code":
        contents.push({
          type: "code",
          text: block.code?.rich_text[0]?.plain_text ?? null,
          language: block.code?.language,
        });
    }
  });

  const post: Post = {
    id: page.id,
    title,
    slug,
    createdTs: (page as PageObjectResponse).created_time,
    lastEditedTs: (page as PageObjectResponse).last_edited_time,
    content: contents,
  };

  console.dir(post, { depth: null });
  return {
    props: { post },
  };
};

const Home: NextPage<StaticProps> = ({ post }) => {
  if (!post) return null;
  return (
    <div className={styles.wrapper}>
      <div className={styles.post}>
        <h1 className={styles.title}>{post.title}</h1>
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
          {post.content.map((content, index) => {
            switch (content.type) {
              case "heading_2":
                return (
                  <h2 className={styles.heading2} key={index}>
                    {content.text}
                  </h2>
                );
              case "heading_3":
                return (
                  <h3 className={styles.heading3} key={index}>
                    {content.text}
                  </h3>
                );
              case "paragraph":
                return (
                  <p className={styles.paragraph} key={index}>
                    {content.text}
                  </p>
                );
              case "code":
                return (
                  <pre className={styles.code} key={index}>
                    <code
                      className={`
                      ${styles.code}
                      lang-${content.language}
                    `}
                    >
                      {content.text}
                    </code>
                  </pre>
                );
              case "quote":
                return (
                  <blockquote className={styles.quote} key={index}>
                    {content.text}
                  </blockquote>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
