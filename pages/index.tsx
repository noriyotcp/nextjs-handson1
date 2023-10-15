import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { GetStaticProps, NextPage } from "next";
import prism from "prismjs";
import { useEffect } from "react";
import { Layout } from "@/lib/component/Layout";
import { PostComponent } from "@/lib/component/Post";

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

export const getPostContents = async (post: Post): Promise<Content[]> => {
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
};

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

export const getStaticProps: GetStaticProps<StaticProps> = async (): Promise<{
  props: { posts: Post[] };
  revalidate: number;
}> => {
  const posts = await getPosts();
  const contentsList = await Promise.all(
    posts.map(async (post) => {
      return getPostContents(post);
    })
  );

  posts.forEach((post, index) => {
    post.contents = contentsList[index];
  });

  return {
    props: { posts },
    revalidate: 60,
  };
};

const Home: NextPage<StaticProps> = ({ posts }) => {
  useEffect(() => {
    prism.highlightAll();
  }, []);

  return (
    <Layout>
      {posts.map((post) => (
        <PostComponent post={post} key={post.id} />
      ))}
    </Layout>
  );
};

export default Home;
