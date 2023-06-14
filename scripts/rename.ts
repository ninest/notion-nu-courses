/* 
Wednesday, June 14, 2023
Set name of notion database pages to `SUBJECT NUMBER: COURSE_NAME`
*/

import { Client } from "@notionhq/client";
import { constants } from "../constants";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function setCoursePageName(subject: string, code: number) {
  // Try retrieving page first
  const rowResponse = await notion.databases.query({
    database_id: constants.COURSES_DATABASE_ID,
    filter: {
      and: [
        { property: "Subject", rich_text: { equals: subject } },
        { property: "Number", number: { equals: code } },
      ],
    },
  });

  if (rowResponse.results.length === 0) {
    throw new Error(`No row for ${subject} ${code}`);
  }

  const page = rowResponse.results[0];

  if (!("properties" in page)) {
    throw new Error(`No properties in row ${subject} ${code}`);
  }

  // @ts-ignore
  const previousPageTitle = page.properties.Name.title[0].text.content;

  // Update title
  await notion.pages.update({
    page_id: page.id,
    properties: {
      Name: { title: [{ text: { content: `${subject} ${code}: ${previousPageTitle}` } }] },
    },
  });
}
// Example usage
// await setCoursePageName("CS", 1100);

const csCoursesResponse = await fetch("https://nu-courses.deno.dev/courses/all/CS");
const courses = await csCoursesResponse.json();

courses.forEach((course: any) => {
  setCoursePageName(course.subject, parseInt(course.number));
});
