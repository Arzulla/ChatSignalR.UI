import axios from "axios";
var hostUrl = process.env.PUBLIC_URL + "api/Chat";

const options = {
  headers: {
    "Content-type": "application/json",
  },
};

export const loadMessage = (requestData) => {
  return axios.get(
    hostUrl +
      "/LoadMessage" +
      `?roomCode=${requestData.roomCode}&skip=${requestData.skip}&take=${requestData.take}`,
    options
  );
};
