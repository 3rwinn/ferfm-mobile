import constants from "../config/constants";

const loadActus = async () => {
  const response = await fetch(`${constants.SERVER}/actus/actus/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("response", response.data);
  return response.json();
};

export default {
  loadActus,
};
