/* 
Mondat, June 26, 2023
Add courses pages that are not already there
*/

import { Client } from "@notionhq/client";
import { constants } from "../constants";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function createPage(subject: string, code: number, courseName: string) {
  // Try retreiving page first
  const rowResponse = await notion.databases.query({
    database_id: constants.COURSES_DATABASE_ID,
    filter: {
      and: [
        { property: "Subject", rich_text: { equals: subject } },
        { property: "Number", number: { equals: code } },
      ],
    },
  });
  if (rowResponse.results.length >= 1) {
    console.log(`${subject} ${code} already exists`)
    const titleFromNotion = rowResponse.results[0].properties.Name.title[0].plain_text;
    if (titleFromNotion !== courseName) {
      console.warn(`${subject} ${code} has different a title: ${titleFromNotion} on Notion vs ${courseName} provided`);
    }
    return;
  }

  // Create it if not there
  await notion.pages.create({
    parent: { database_id: constants.COURSES_DATABASE_ID }, properties: {
      Name: { title: [{ text: { content: courseName } }] },
      Subject: { rich_text: [{ text: { content: subject } }] },
      Number: { number: code },
      // No info status
      Status: { status: { id: "987e3e2e-b789-4408-b130-152b18acee12" } },
    },
  })
}

// Example usage:
// await createPage("CS", 1100, "CS 1100: Computer Science and Its Applications")

const subjectsResponse = await fetch("https://nu-courses.deno.dev/subjects");
const subjects = await subjectsResponse.json();

for (const subject of subjects) {
  const coursesResponse = await fetch(`https://nu-courses.deno.dev/courses/all/${subject.code}`);
  const courses = await coursesResponse.json();

  // Wait few seconds for rate limit
  await new Promise(resolve => setTimeout(resolve, 4000));

  for (const course of courses) {
    const courseName = `${course.subject} ${course.number}: ${course.title}`;
    await createPage(course.subject, parseInt(course.number), courseName);

    await new Promise(resolve => setTimeout(resolve, 4000));
  }
}