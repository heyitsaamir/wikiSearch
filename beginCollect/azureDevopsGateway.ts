import axios from "axios";

interface Wiki {
  path: string;
  order: number;
  gitItemPath: string;
  subPages: any[];
  url: string;
  remoteUrl: string;
  id: number;
  content: string;
}

export const getWiki = async (wikiUrl: string) => {
  const response = await axios.get<Wiki>(wikiUrl, {
    params: { includeContent: "True" },
    auth: {
      username: process.env["AZURE_USERNAME"],
      password: process.env["AZURE_PAT"],
    },
  });
  return response.data;
};
