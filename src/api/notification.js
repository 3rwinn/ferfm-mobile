import constants from "../config/constants";

const registerPushToken = async (token) => {
  const response = await fetch(
    `${constants.SERVER}/push_notifications/register-token/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default {
  registerPushToken,
};
