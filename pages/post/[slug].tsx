import { GetStaticPaths, GetStaticProps } from "next";
import { NextPage } from "next";
import { useEffect } from "react";
import { getPosts, getPostContents, Post } from "../index";
import { Layout } from "../../lib/component/Layout";
import { PostComponent } from "../../lib/component/Post";

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
> = async ({
  params,
}): Promise<
  | {
      props: { post?: Post };
      revalidate: number;
    }
  | typeof notFoundProps
> => {
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
  const posts = await getPosts(slug);
  const post = posts.shift();
  if (!post) {
    return notFoundProps;
  }

  const contents = await getPostContents(post);
  post.contents = contents;
  return { props: { post }, revalidate: 60 };
};

const PostPage: NextPage<StaticProps> = ({ post }) => {
  if (!post) {
    return null;
  }

  return (
    <Layout>
      <PostComponent post={post} />
    </Layout>
  );
};

export default PostPage;
