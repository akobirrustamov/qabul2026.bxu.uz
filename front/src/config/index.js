import axios from "axios";
export let baseUrl;
baseUrl = "http://localhost:8080";
// baseUrl = "https://qabul2026.bxu.uz";
// baseUrl = "";
export default function (url, method, data, param, is_user) {
  let token = localStorage.getItem("access_token");

  return axios({
    url: baseUrl + url,
    method: method,
    data: data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: param,
  })
    .then((res) => {
      if (res.data) {
        return {
          error: false,
          data: res.data,
        };
      }
    })
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return {
          error: true,
          data: 401,
        };
      }

      return {
        error: true,
        data: err.response?.data,
      };
    });
}
