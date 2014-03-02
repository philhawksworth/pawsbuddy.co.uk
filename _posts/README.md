# Blogging instructions

Each new blog post should be created as a new file in the `_posts` directory.

They should start with something called `front-matter` which is just a few variables. That looks like this:

`
---
layout: post
pageclass: blog

title: Blogging help
youtubecode: ew5VUSaAMPk
published: true
---
`

Everything other than the title, the youtube link and the image link go in the main content section of the post which is this one. Anything that appears before the "more" separator (see it in the code below) will be turned into the excerpt text whcih appears as a little summary of the post on the blog listing page.

<!--more-->

If a include a YouTube video code in the top of the page, it will be embedded right after the exceprt text, then any remaining text will follow. All text after the first one will form the body of your blog post. You could just have a single paragraph if you like. Short posts are cool too!

You don't need to know html to write this content, it will use something called _markdown_ which is a shorthand for writing web pages. It gives you some simple formatting and an easy way to make links. Here is a little cheat sheet:

## Headings

You can add headings by using the `##` notation. Just add  `##` to a line of text and it will become a heading, (like the one above)


## Links

You wrap the text of the link in square braces. The URL of the link goes in regular braces like this:

`[Phil's blog site](http://hawksworx.com)` gives you [Phil's blog site](http://hawksworx.com)


## Publishing or saving as a draft

The top of each blog post file has a section with some varaible in it. One of those is called `published`.  If that has a value of `true` then the post will be published on the site. Anthything that has a value of `false` will just remain saved but unpublished. (Like this post)


## YouTube

You can embed a YouTube video into a post by adding a `youtubecode` variable at the top of the file. Like this one:

`youtubecode: ew5VUSaAMPk`

You'll find the Youtube video code in the URL of any YouTube video. It will be in the URL as a variable called `v` like this:

`http://www.youtube.com/watch?v=ew5VUSaAMPk&list=UUH6vXjt-BA7QHl0KnfL-7RQ&feature=c4-overview`

Just copy the value of `v` and include it in the blog post file like this:

`youtubecode: ew5VUSaAMPk`

This will automatically embed the video after any excerpt you right for the post. Adding some introduction to the video will be good for keeping the style consisitent and justifying embedding it for sharing.
