import axios, { AxiosError } from 'axios';

interface IToken {
  usuarioProfessor: string;
  isImpersonating: string;
  role: string[];
  membroDe: string[];
  nome: string;
  username: string;
}

export const useApi = () => {
  const getApiUrl = () => {
    let url;
    var pathname = window.location.href
    // console.log(CONFIG.GATEWAY_URL)
    if(pathname.includes("localhost")){
      url = 'http://localhost:5000';
    } else if(pathname.includes("-stg")){
      url = "https://rna-algarismos-stg.lag0.com.br";
    } else {
      url = "https://rna-algarismos.lag0.com.br";
    }
    return url;
  }
  const api = axios.create({
    baseURL: getApiUrl(),
  });

  api.interceptors.request.use(async (config) => {
    // const token = Cookies.get(AuthCookieName);

    // if (token) {
    //   config.headers["Authorization"] = `Bearer ${token}`;
    // }

    return config;
  });

  api.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error: AxiosError) {
      if (401 === error?.response?.status) {
        // alert("Houve um problema de autenticação, por favor logue novamente.");
        // if(window.location.href.includes("/login"))
        //   window.location.href = "/login";
      } else {
        return Promise.reject(error);
      }
    }
  );
  return { api };
};