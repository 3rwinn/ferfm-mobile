import constants from "../config/constants";

const askQuestion = async (question) => {
  try {
    const response = await fetch(`${constants.SERVER}/knowledge/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      ok: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error asking question:", error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

export default {
  askQuestion,
};
