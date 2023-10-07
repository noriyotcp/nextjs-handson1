import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { GetStaticProps, NextPage } from "next";
import styles from "../styles/Home.module.css";
import dayjs from "dayjs";
import prism from "prismjs";
import { useEffect } from "react";

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
  contents: Content[];
};

type StaticProps = {
  posts: Post[];
};

async function getPostContents(post: Post): Promise<Content[]> {
  const blockResponse = await notion.blocks.children.list({
    block_id: post.id,
  });

  const contents: Content[] = [];
  blockResponse.results.forEach((block) => {
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

  return contents;
}

export async function getPosts(slug?: string): Promise<Post[]> {
  let database: QueryDatabaseResponse | undefined = undefined;
  if (slug) {
    database = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID || "",
      filter: {
        and: [
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });
  } else {
    database = await notion.databases.query({
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
  }

  const posts: Post[] = [];
  await Promise.all(
    database.results.map(async (page) => {
      if (!("properties" in page)) {
        return;
      }
      let title: string | null = null;
      if (page.properties["Name"].type === "title") {
        const titleRes = page.properties["Name"]
          .title as RichTextItemResponse[];
        title = titleRes[0]?.plain_text ?? null;
      }
      let slug: string | null = null;
      if (page.properties["Slug"].type === "rich_text") {
        const slugRes = page.properties["Slug"]
          .rich_text as RichTextItemResponse[];
        slug = slugRes[0]?.plain_text ?? null;
      }
      const contents = await getPostContents({
        id: page.id,
        title,
        slug,
        createdTs: (page as PageObjectResponse).created_time,
        lastEditedTs: (page as PageObjectResponse).last_edited_time,
        contents: [],
      });
      posts.push({
        id: page.id,
        title,
        slug,
        createdTs: (page as PageObjectResponse).created_time,
        lastEditedTs: (page as PageObjectResponse).last_edited_time,
        contents,
      });
    })
  );

  return posts;
}

export const getStaticProps = async (): Promise<{
  props: { posts: Post[] };
}> => {
  const posts = await getPosts();
  return {
    props: { posts },
  };
};

const Home: NextPage<StaticProps> = ({ posts }) => {
  useEffect(() => {
    prism.highlightAll();
  }, []);

  return (
    <div className={styles.wrapper}>
      {posts.map((post) => (
        <div className={styles.post} key={post.id}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.timestampWrapper}>
            <div>
              <div className={styles.timestamp}>
                作成日時: {dayjs(post.createdTs).format("YYYY-MM-DD HH:mm:ss")}
              </div>
              <div className={styles.timestamp}>
                更新日時:{" "}
                {dayjs(post.lastEditedTs).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            </div>
          </div>
          <div>
            {post.contents.map((content, index) => {
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
      ))}
    </div>
  );
};

export default Home;
