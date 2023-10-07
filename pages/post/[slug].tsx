import { GetStaticPaths, GetStaticProps } from "next";
import { getPosts, getPostContents, Post } from "../index";
import { NextPage } from "next";

type StaticPathsParams = {
  slug: string;
};

type StaticProps = {
  post?: Post;
};

export const getStaticPaths: GetStaticPaths<StaticPathsParams> = async () => {
  const posts = await getPosts();
  const paths: {
    params: { slug: string };
  }[] = [];

  posts.forEach((post) => {
    const slug = post.slug;
    if (slug) {
      paths.push({ params: { slug } });
    }
  });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<
  StaticProps,
  StaticPathsParams
> = async ({ params, preview }) => {
  const notFoundProps = {
    props: {},
    redirect: {
      destination: "/404",
    },
  };
  if (!params) {
    return notFoundProps;
  }

  const { slug } = params;
  const posts = await getPosts(params.slug);
  const post = posts.shift();
  if (!post) {
    return notFoundProps;
  }

  const contents = await getPostContents(post);
  post.contents = contents;
  return { props: { post } };
};

const PostPage: NextPage<StaticProps> = ({ post }) => {
  if (!post) {
    return null;
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.createdTs}</p>
      <p>{post.lastEditedTs}</p>
      <ul>
        {post.contents.map((content, index) => {
          switch (content.type) {
            case "paragraph":
              return <p key={index}>{content.text}</p>;
            case "heading_2":
              return <h2 key={index}>{content.text}</h2>;
            case "heading_3":
              return <h3 key={index}>{content.text}</h3>;
            case "quote":
              return <blockquote key={index}>{content.text}</blockquote>;
            case "code":
              return (
                <pre key={index}>
                  <code>{content.text}</code>
                </pre>
              );
          }
        })}
      </ul>
    </div>
  );
};

export default PostPage;
