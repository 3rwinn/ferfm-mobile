import client from "./client";

const askQuestion = (question) =>
  client.post("/knowledge/query/", { question });

export default {
  askQuestion,
};
