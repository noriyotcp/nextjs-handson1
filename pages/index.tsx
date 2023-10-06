import { Client } from "@notionhq/client";
import { GetStaticProps } from "next";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

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
