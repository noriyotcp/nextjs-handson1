import { Client } from "@notionhq/client";
import { GetStaticProps } from "next";

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

export const getStaticProps: GetStaticProps<{}> = async () => {
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

  console.dir(database, { depth: null });

  const blocks = await notion.blocks.children.list({
    block_id: database.results[0]?.id,
  });

  console.dir(blocks, { depth: null });

  return {
    props: {},
  };
};

export default function Home() {
  return <div>hello world</div>;
}
