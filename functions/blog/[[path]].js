// /blog and /blog/<slug> -> blog.html with that post's own share-preview tags.
import { handleShare, blogBase } from "../../cf-lib/share-meta.js";

export async function onRequestGet(context) {
  return handleShare(context, {
    section: "blog",
    page: "/blog",
    data: "/content/blog-posts.json",
    listKey: "posts",
    base: blogBase,
    fallbackTitle: "Blog",
    fallbackDesc: "MD Sariful Islam-এর ব্লগ পোস্ট",
    descField: "excerpt",
    imageField: "image",
  });
}
