import { readFileSync } from "fs";
import * as sass from "sass";
import htmlmin from "html-minifier-terser";
import { VentoPlugin } from "eleventy-plugin-vento";

export default function (eleventyConfig) {
  // Vento templating
  eleventyConfig.addPlugin(VentoPlugin);

  // Layout alias
  eleventyConfig.addLayoutAlias("default", "layouts/base.vto");

  // Date filter
  eleventyConfig.addFilter("date", function (date, part) {
    var d = new Date(date);
    if (part == "year") {
      return d.getUTCFullYear();
    }
    var month = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var ordinal = {
      1: "st",
      2: "nd",
      3: "rd",
      21: "st",
      22: "nd",
      23: "rd",
      31: "st",
    };
    return (
      month[d.getMonth()] +
      " " +
      d.getDate() +
      (ordinal[d.getDate()] || "th") +
      " " +
      d.getUTCFullYear()
    );
  });

  // Global data: compiled SASS styles
  eleventyConfig.addGlobalData("styles", function () {
    const result = sass.compile("./src/scss/main.scss", {
      style: "compressed",
    });
    return result.css;
  });

  // JS bundle shortcode
  eleventyConfig.addShortcode("jsbundle", function () {
    const files = ["core.js", "form-validate.js", "toggleDetails.js", "dynamic-form.js"];
    return files
      .map((f) => readFileSync(`./src/js/${f}`, "utf8"))
      .join("\n");
  });

  // Passthrough copies
  eleventyConfig.addPassthroughCopy("src/site/images");
  eleventyConfig.addPassthroughCopy("src/site/robots.txt");
  eleventyConfig.addPassthroughCopy("src/site/humans.txt");
  eleventyConfig.addPassthroughCopy("src/site/_redirects");

  // HTML minification
  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = await htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }
    return content;
  });

  return {
    dir: {
      input: "src/site",
      output: "dist",
      data: "_data",
    },
    templateFormats: ["vto", "md"],
  };
}
