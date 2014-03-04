# Blogging instructions

Each new blog post should be created as a new file in the `_posts` directory.


## File name

In order to get published, you'll need to name the new blog post file using the correct nameing convention. That is:

YYYY-MM-DD-the-url-for-this-blog-post-using-dashes-between-words.md


## Variables

They should start with something called `front matter` which just sets a few variables. That looks like this:


```
---
layout: post
pageclass: blog

title: Blogging help
youtubecode: ew5VUSaAMPk
published: true
---
```

Start things off with a little intro. This bit of text before the "more tag" below, will appear as the excerpt on the blog page, and also as the text before the YouTube video, if you inlclude one.

<!--more-->

The rest of the post, goes here. If you included a YouTube link by adding the the youtubecode code in the front matter at the top of this file, this text will appear after it.

You can create a new paragraph as normal. Carriage returns are all understood.


## Headings

You can create a heading but using the `##` syntax above.


## Links

You can make links to things like this: [Link text goes here](URL-GOES-HERE)


## Bullet lists

Bullet lists are simple to make, just use this syntax:

* Asterisks
* make
* bullet
* lists


## Publishing

Make sure to change to set `published: true` in the front matter at the top of the file if you want the post to go live.



## YouTube

You can embed a YouTube video into a post by adding a `youtubecode` variable at the top of the file. Like this one:

`youtubecode: ew5VUSaAMPk`

You'll find the Youtube video code in the URL of any YouTube video. It will be in the URL as a variable called `v` like this:

`http://www.youtube.com/watch?v=ew5VUSaAMPk&list=UUH6vXjt-BA7QHl0KnfL-7RQ&feature=c4-overview`

Just copy the value of `v` and include it in the blog post file like this:

`youtubecode: ew5VUSaAMPk`

This will automatically embed the video after any excerpt you right for the post. Adding some introduction to the video will be good for keeping the style consistent and justifying embedding it for sharing.
